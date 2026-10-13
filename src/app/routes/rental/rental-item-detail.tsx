import { CalendarRange, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import {
  CheckboxGroupField,
  Field,
  FormActions,
  FormError,
  FormSection,
  ImageGalleryField,
  LocalizedField,
  UnsavedDialog,
} from "@/components/form";
import {
  Button,
  Checkbox,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  NativeSelect,
  NativeSelectOption,
  PageHeader,
  StatusBadge,
  Field as UiField,
} from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  RENTAL_CONDITIONS,
  RENTAL_ITEM_MAX_MEDIA,
  RENTAL_UNITS,
  rentalAdminService,
  type RentalCategory,
  type RentalCondition,
  type RentalDepot,
  type RentalItem,
  type RentalItemDraft,
  type RentalRate,
  type RentalUnit,
} from "@/features/rental";
import { sportsService, type Sport } from "@/features/sports";
import { useAsyncAction, useAsyncData, useUnsavedGuard } from "@/hooks";
import { LOCALE_LABELS, useFormatters, useTranslation } from "@/i18n";
import { parseMoneyInput, toMoneyInputValue } from "@/lib";
import type { LocalizedText, Media, Money, PublishStatus } from "@/types";

import { BackLink } from "../../components/record-parts";
import { recordPath } from "../../record-paths";
import { categoryTree, rentalItemPath, slugify } from "./rental-helpers";

/**
 * One rental item: `/rental/items/new` creates it, `/rental/items/:itemId`
 * edits it. The same form serves both.
 *
 * Prices are typed as JOD with three decimals — the way they are printed —
 * and stored as integer fils. The form therefore holds what was typed, as
 * strings, and turns it into a draft only on submit. Anything that does not
 * read as a number is sent as one the service will refuse, so every rule
 * lives in the service and every message comes back on its field in one pass.
 */

const EMPTY_TEXT: LocalizedText = { en: "", ar: "" };
const PUBLISH_STATUSES: readonly PublishStatus[] = ["draft", "published", "archived"];

interface RateRow {
  readonly offered: boolean;
  readonly price: string;
  readonly minUnits: string;
  readonly maxUnits: string;
}

interface ItemForm {
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText;
  /** Already uploaded: the gallery holds what the upload endpoint returned. */
  readonly media: readonly Media[];
  readonly status: PublishStatus;
  readonly condition: RentalCondition;
  readonly depotId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly totalUnits: string;
  readonly rates: Readonly<Record<RentalUnit, RateRow>>;
  readonly deposit: string;
}

function toForm(item: RentalItem | null): ItemForm {
  const rates = Object.fromEntries(
    RENTAL_UNITS.map((unit) => {
      const rate = item?.rates.find((entry) => entry.unit === unit);
      const row: RateRow = rate
        ? {
            offered: true,
            price: toMoneyInputValue(rate.price),
            minUnits: String(rate.minUnits),
            maxUnits: rate.maxUnits != null ? String(rate.maxUnits) : "",
          }
        : /* A new item starts hired by the day — the most common rate in the fleet. */
          { offered: !item && unit === "day", price: "", minUnits: "1", maxUnits: "" };
      return [unit, row];
    }),
  ) as Record<RentalUnit, RateRow>;

  return {
    slug: item?.slug ?? "",
    title: item?.title ?? EMPTY_TEXT,
    summary: item?.summary ?? EMPTY_TEXT,
    description: item?.description ?? EMPTY_TEXT,
    media: item?.media ?? [],
    status: item?.status ?? "draft",
    condition: item?.condition ?? "new",
    depotId: item?.location?.id ?? "",
    categoryIds: item?.categoryIds ?? [],
    sportIds: item?.sportIds ?? [],
    totalUnits: item ? String(item.totalUnits) : "1",
    rates,
    deposit: item?.deposit ? toMoneyInputValue(item.deposit) : "",
  };
}

/* An unreadable count or amount becomes NaN, which the service rejects with the
   field's own message (and JSON sends as null, which it rejects the same way). */
const count = (value: string) => (value.trim() === "" ? Number.NaN : Number(value.trim()));
const jod = (value: string): Money => parseMoneyInput(value, "JOD") ?? { amount: Number.NaN, currency: "JOD" };

function toDraft(form: ItemForm): RentalItemDraft {
  const rates: RentalRate[] = RENTAL_UNITS.filter((unit) => form.rates[unit].offered).map((unit) => {
    const row = form.rates[unit];
    return {
      unit,
      price: jod(row.price),
      minUnits: count(row.minUnits),
      ...(row.maxUnits.trim() === "" ? {} : { maxUnits: count(row.maxUnits) }),
    };
  });
  return {
    slug: form.slug.trim(),
    title: form.title,
    summary: form.summary,
    description: form.description,
    media: form.media,
    status: form.status,
    condition: form.condition,
    depotId: form.depotId,
    categoryIds: form.categoryIds,
    sportIds: form.sportIds,
    totalUnits: count(form.totalUnits),
    rates,
    deposit: form.deposit.trim() === "" ? undefined : jod(form.deposit),
  };
}

/* What "unsaved changes" compares. An uploaded image can be a data URL hundreds
   of kilobytes long, so the gallery is compared by id, order and alt text
   rather than stringified whole on every keystroke. */
const fingerprint = (form: ItemForm) =>
  JSON.stringify({
    ...form,
    media: form.media.map((entry) => [entry.id, entry.kind === "image" ? entry.alt : ""]),
  });

export function RentalItemDetailRoute() {
  const { itemId = "new" } = useParams();
  const { t } = useTranslation();
  const { text } = useFormatters();
  const isNew = itemId === "new";
  const noun = t("rental.itemNoun");
  const state = useAsyncData(
    () =>
      Promise.all([
        isNew ? Promise.resolve(null) : rentalAdminService.getItem(itemId),
        rentalAdminService.listDepots(),
        rentalAdminService.listCategories(),
        sportsService.list(),
      ]),
    [itemId],
  );

  return (
    <RequirePermission permission={isNew ? "rental:write" : "rental:read"}>
      <BackLink to="/rental/items" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {([item, depots, categories, sports]) =>
          !isNew && !item ? (
            <StateMessage tone="error" title={t("state.errorTitle")} />
          ) : (
            <>
              <PageHeader
                title={item ? t("crud.editNoun", { noun }) : t("crud.newNoun", { noun })}
                description={item ? text(item.title) : undefined}
                actions={
                  item ? (
                    <>
                      <StatusBadge status={item.status} />
                      <Button asChild variant="outline" size="sm">
                        <Link to={recordPath.rentalItemBookings(item.id)}>
                          <CalendarRange aria-hidden="true" /> {t("rental.viewBookings")}
                        </Link>
                      </Button>
                    </>
                  ) : undefined
                }
              />
              {/* Keyed by the record, not its version: a save resets the form
                  itself, so refreshing the header never throws away an edit. */}
              <ItemEditor
                key={item?.id ?? "new"}
                item={item}
                depots={depots}
                categories={categories}
                sports={sports}
                onSaved={state.refetch}
              />
            </>
          )
        }
      </AsyncBoundary>
    </RequirePermission>
  );
}

function ItemEditor({
  item,
  depots,
  categories,
  sports,
  onSaved,
}: {
  item: RentalItem | null;
  depots: readonly RentalDepot[];
  categories: readonly RentalCategory[];
  sports: readonly Sport[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { text } = useFormatters();
  const notice = useNotice();
  const navigate = useNavigate();
  const canWrite = usePermission("rental:write");
  const noun = t("rental.itemNoun");

  const [form, setForm] = useState<ItemForm>(() => toForm(item));
  const [baseline, setBaseline] = useState<ItemForm>(() => toForm(item));
  /* The slug follows the English title on a new item until someone types in it. */
  const [slugTouched, setSlugTouched] = useState(item !== null);
  const [deleting, setDeleting] = useState(false);
  /*
   * Leaving after a create or a delete goes through state, not a direct
   * `navigate`: the unsaved-changes guard reads the last render, so it has to
   * see "leaving" before the navigation it would otherwise stop.
   */
  const [leaveTo, setLeaveTo] = useState<{ to: string; replace: boolean } | null>(null);

  const save = useAsyncAction(
    (next: ItemForm) =>
      item
        ? rentalAdminService.updateItem(item.id, toDraft(next))
        : rentalAdminService.createItem(toDraft(next)),
    {
      onSuccess: (saved) => {
        if (item) {
          /* What the service stored, which may be tidier than what was typed. */
          const stored = toForm(saved);
          setForm(stored);
          setBaseline(stored);
          notice.success(t("crud.updated"));
          onSaved();
        } else {
          notice.success(t("crud.created", { noun }));
          setLeaveTo({ to: rentalItemPath(saved.id), replace: true });
        }
      },
    },
  );

  const isDirty = fingerprint(form) !== fingerprint(baseline);
  const blocker = useUnsavedGuard(isDirty && !save.isPending && leaveTo === null);

  useEffect(() => {
    if (leaveTo) navigate(leaveTo.to, { replace: leaveTo.replace });
  }, [leaveTo, navigate]);

  const setRate = (unit: RentalUnit, patch: Partial<RateRow>) =>
    setForm({ ...form, rates: { ...form.rates, [unit]: { ...form.rates[unit], ...patch } } });
  /* Prices are shown the way they are printed: 18 becomes 18.000 on leaving the box. */
  const tidyAmount = (value: string) => {
    const money = parseMoneyInput(value, "JOD");
    return money ? toMoneyInputValue(money) : value;
  };

  const fieldErrors = save.fieldErrors;
  const localized = (key: string, label: string) => ({
    [`${key}.en`]: `${label} — ${LOCALE_LABELS.en}`,
    [`${key}.ar`]: `${label} — ${LOCALE_LABELS.ar}`,
  });
  const errorLabels: Record<string, string> = {
    ...localized("title", t("field.title")),
    ...localized("summary", t("field.summary")),
    ...localized("description", t("field.description")),
    slug: t("field.slug"),
    media: t("rental.sectionImages"),
    status: t("field.status"),
    condition: t("rental.conditionLabel"),
    depotId: t("rental.depot"),
    categoryIds: t("field.categories"),
    sportIds: t("field.sports"),
    totalUnits: t("rental.totalUnits"),
    rates: t("rental.rates"),
    deposit: t("rental.depositJod"),
    ...Object.fromEntries(
      RENTAL_UNITS.flatMap((unit) => [
        [`rates.${unit}.price`, `${t(`rental.rateBy.${unit}`)} — ${t("rental.ratePrice")}`],
        [`rates.${unit}.minUnits`, `${t(`rental.rateBy.${unit}`)} — ${t("rental.minUnits")}`],
        [`rates.${unit}.maxUnits`, `${t(`rental.rateBy.${unit}`)} — ${t("rental.maxUnits")}`],
      ]),
    ),
  };

  return (
    <>
      <UnsavedDialog blocker={blocker} />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.run(form);
        }}
      >
        {/* At the top, where it is seen without scrolling back. The fields keep
            their own inline messages; this is the map to them. */}
        <FormError error={save.error} labels={errorLabels} />

        {/* A role that can read but not write sees the record, not a form it
            cannot submit. */}
        <fieldset disabled={!canWrite} className="m-0 min-w-0 border-0 p-0">
          {/* What the item is and what it costs on the main side; how it is
              shown and filed on the side — the two are edited at different moments. */}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-6">
              <FormSection title={t("section.details")} description={t("section.contentHint")}>
                <LocalizedField
                  name="title"
                  label={t("field.title")}
                  value={form.title}
                  onChange={(title) =>
                    setForm({ ...form, title, ...(slugTouched ? {} : { slug: slugify(title.en) }) })
                  }
                  fieldErrors={fieldErrors}
                  required
                />
                <Field name="slug" label={t("field.slug")} hint={t("field.slugHint")} error={fieldErrors?.slug} required>
                  {(props) => (
                    <Input
                      {...props}
                      dir="ltr"
                      className="font-mono text-[0.8rem] sm:max-w-md"
                      value={form.slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        setForm({ ...form, slug: event.target.value.toLowerCase() });
                      }}
                    />
                  )}
                </Field>
                <LocalizedField
                  name="summary"
                  label={t("field.summary")}
                  value={form.summary}
                  onChange={(summary) => setForm({ ...form, summary })}
                  fieldErrors={fieldErrors}
                  required
                />
                <LocalizedField
                  name="description"
                  label={t("field.description")}
                  value={form.description}
                  onChange={(description) => setForm({ ...form, description })}
                  fieldErrors={fieldErrors}
                  multiline
                />
                {/* One column, so a sub-category reads directly under its parent;
                    the dash marks how deep it sits. The wrapper drops the group's
                    bottom margin: it is the last thing in the card. */}
                <div className="[&>fieldset]:mb-0">
                  <CheckboxGroupField
                    name="categoryIds"
                    legend={t("field.categories")}
                    hint={t("rental.categoriesHint")}
                    required
                    columns={1}
                    error={fieldErrors?.categoryIds}
                    options={categoryTree(categories).map(({ category, depth }) => ({
                      value: category.id,
                      label: text(category.name),
                      depth,
                    }))}
                    value={form.categoryIds}
                    onChange={(categoryIds) => setForm({ ...form, categoryIds })}
                  />
                </div>
              </FormSection>

              {/* Uploaded the moment they are picked; the list is saved with the
                  rest of the form, in the order shown — the first is the cover.
                  The change is applied to the latest form, not the one this
                  render saw: an upload can finish while someone is typing. */}
              <FormSection title={t("rental.sectionImages")} description={t("rental.sectionImagesHint")}>
                <div className="[&>fieldset]:mb-0">
                  <ImageGalleryField
                    name="media"
                    label={t("rental.photos")}
                    value={form.media}
                    onChange={(media) => setForm((current) => ({ ...current, media }))}
                    purpose="rental-item"
                    max={RENTAL_ITEM_MAX_MEDIA}
                    error={fieldErrors?.media}
                    disabled={!canWrite}
                  />
                </div>
              </FormSection>

              <FormSection title={t("section.pricing")} description={t("section.pricingHint")}>
                <FieldSet
                  aria-describedby={fieldErrors?.rates ? "rates-hint rates-error" : "rates-hint"}
                  aria-invalid={fieldErrors?.rates ? true : undefined}
                  data-invalid={fieldErrors?.rates ? true : undefined}
                  className="mb-5 gap-3"
                >
                  <FieldLegend variant="label" className="mb-0">
                    {t("rental.rates")}
                    <span aria-hidden="true" className="ms-0.5 text-destructive">
                      *
                    </span>
                    <span className="sr-only"> (required)</span>
                  </FieldLegend>
                  <FieldDescription id="rates-hint">{t("rental.ratesHint")}</FieldDescription>
                  <div className="divide-y overflow-hidden rounded-lg border">
                    {RENTAL_UNITS.map((unit) => {
                      const row = form.rates[unit];
                      const at = `rates.${unit}`;
                      /* The first box is where the summary's "Rates" link lands. */
                      const offeredId = unit === RENTAL_UNITS[0] ? "field-rates" : `field-${at}.offered`;
                      return (
                        /* Each row is its own group, so "Price (JOD)" is announced as
                           the hourly, daily or weekly price. */
                        <fieldset
                          key={unit}
                          className={`m-0 grid min-w-0 grid-cols-3 items-start gap-3 border-0 p-3 transition-colors sm:grid-cols-[9rem_repeat(3,minmax(0,1fr))] ${
                            row.offered ? "" : "bg-muted/40"
                          }`}
                        >
                          <legend className="sr-only">{t(`rental.rateBy.${unit}`)}</legend>
                          <UiField orientation="horizontal" className="col-span-3 w-auto gap-2 sm:col-span-1 sm:mt-7 sm:h-8">
                            <Checkbox
                              id={offeredId}
                              checked={row.offered}
                              onCheckedChange={(checked) => setRate(unit, { offered: checked === true })}
                            />
                            <FieldLabel htmlFor={offeredId}>{t(`rental.rateBy.${unit}`)}</FieldLabel>
                          </UiField>
                          <Field
                            name={`${at}.price`}
                            label={t("rental.ratePrice")}
                            error={fieldErrors?.[`${at}.price`]}
                            className="mb-0"
                          >
                            {(props) => (
                              <Input
                                {...props}
                                dir="ltr"
                                inputMode="decimal"
                                placeholder="0.000"
                                disabled={!row.offered}
                                value={row.price}
                                onChange={(event) => setRate(unit, { price: event.target.value })}
                                onBlur={() => setRate(unit, { price: tidyAmount(row.price) })}
                              />
                            )}
                          </Field>
                          <Field
                            name={`${at}.minUnits`}
                            label={t("rental.minUnits")}
                            error={fieldErrors?.[`${at}.minUnits`]}
                            className="mb-0"
                          >
                            {(props) => (
                              <Input
                                {...props}
                                dir="ltr"
                                type="number"
                                min={1}
                                step={1}
                                disabled={!row.offered}
                                value={row.minUnits}
                                onChange={(event) => setRate(unit, { minUnits: event.target.value })}
                              />
                            )}
                          </Field>
                          <Field
                            name={`${at}.maxUnits`}
                            label={t("rental.maxUnits")}
                            error={fieldErrors?.[`${at}.maxUnits`]}
                            className="mb-0"
                          >
                            {(props) => (
                              <Input
                                {...props}
                                dir="ltr"
                                type="number"
                                min={1}
                                step={1}
                                disabled={!row.offered}
                                value={row.maxUnits}
                                onChange={(event) => setRate(unit, { maxUnits: event.target.value })}
                              />
                            )}
                          </Field>
                        </fieldset>
                      );
                    })}
                  </div>
                  {fieldErrors?.rates ? <FieldError id="rates-error">{fieldErrors.rates}</FieldError> : null}
                </FieldSet>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field
                    name="deposit"
                    label={t("rental.depositJod")}
                    hint={t("rental.depositHint")}
                    error={fieldErrors?.deposit}
                    className="mb-0"
                  >
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        inputMode="decimal"
                        placeholder="0.000"
                        value={form.deposit}
                        onChange={(event) => setForm({ ...form, deposit: event.target.value })}
                        onBlur={() => setForm({ ...form, deposit: tidyAmount(form.deposit) })}
                      />
                    )}
                  </Field>
                </div>
              </FormSection>

              <FormSection
                title={t("rental.sectionUnitsCondition")}
                description={t("rental.sectionUnitsConditionHint")}
              >
                <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                  <Field
                    name="totalUnits"
                    label={t("rental.totalUnits")}
                    hint={t("rental.totalUnitsHint")}
                    error={fieldErrors?.totalUnits}
                    required
                    className="mb-0"
                  >
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        type="number"
                        min={1}
                        step={1}
                        value={form.totalUnits}
                        onChange={(event) => setForm({ ...form, totalUnits: event.target.value })}
                      />
                    )}
                  </Field>
                  <Field
                    name="condition"
                    label={t("rental.conditionLabel")}
                    error={fieldErrors?.condition}
                    className="mb-0"
                  >
                    {(props) => (
                      <NativeSelect
                        {...props}
                        value={form.condition}
                        onChange={(event) => setForm({ ...form, condition: event.target.value as RentalCondition })}
                      >
                        {RENTAL_CONDITIONS.map((condition) => (
                          <NativeSelectOption key={condition} value={condition}>
                            {t(`rental.conditionValue.${condition}`)}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    )}
                  </Field>
                </div>
              </FormSection>

              {/* Keyed by the version, so a save elsewhere on the page resets it. */}
              {item ? <OutOfService key={item.audit.updatedAt} item={item} onSaved={onSaved} /> : null}
            </div>

            <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-16">
              <FormSection title={t("section.visibility")} description={t("section.visibilityHint")}>
                <Field name="status" label={t("field.status")} error={fieldErrors?.status} className="mb-0">
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={form.status}
                      onChange={(event) => setForm({ ...form, status: event.target.value as PublishStatus })}
                    >
                      {PUBLISH_STATUSES.map((status) => (
                        <NativeSelectOption key={status} value={status}>
                          {t(`statusLabel.${status}`)}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
              </FormSection>

              <FormSection title={t("section.organisation")} description={t("rental.organisationHint")}>
                <Field
                  name="depotId"
                  label={t("rental.depot")}
                  hint={t("rental.depotHint")}
                  error={fieldErrors?.depotId}
                  required
                >
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={form.depotId}
                      onChange={(event) => setForm({ ...form, depotId: event.target.value })}
                    >
                      <NativeSelectOption value="">{t("rental.chooseDepot")}</NativeSelectOption>
                      {depots.map((depot) => (
                        <NativeSelectOption key={depot.id} value={depot.id}>
                          {`${text(depot.name)} · ${text(depot.city)}`}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
                <div className="[&>fieldset]:mb-0">
                  <CheckboxGroupField
                    name="sportIds"
                    legend={t("field.sports")}
                    hint={t("rental.sportsHint")}
                    columns={2}
                    error={fieldErrors?.sportIds}
                    options={sports.map((sport) => ({ value: sport.id, label: text(sport.name) }))}
                    value={form.sportIds}
                    onChange={(sportIds) => setForm({ ...form, sportIds })}
                  />
                </div>
              </FormSection>
            </div>
          </div>
        </fieldset>

        <FormActions
          start={
            item && canWrite ? (
              <Button type="button" variant="destructive" onClick={() => setDeleting(true)}>
                <Trash2 /> {t("crud.delete")}
              </Button>
            ) : null
          }
        >
          <Button type="button" variant="outline" onClick={() => navigate("/rental/items")}>
            {t("action.cancel")}
          </Button>
          <Button type="submit" disabled={!canWrite || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {save.isPending ? t("action.saving") : item ? t("action.save") : t("crud.create")}
          </Button>
        </FormActions>
      </form>

      {item ? (
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title={t("crud.deleteTitle", { name: text(item.title) })}
          onConfirm={async () => {
            await rentalAdminService.deleteItem(item.id);
            notice.success(t("crud.deleted", { name: text(item.title) }));
            setLeaveTo({ to: "/rental/items", replace: false });
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Withdrawing units from hire is its own command, not part of the item form:
 * it is what the depot does when a board comes back cracked, on a record nobody
 * is otherwise editing. It saves on its own button, straight away.
 *
 * It sits inside the item form on the page, and a form cannot hold another
 * form, so this one is a group rather than a `<form>`: Enter in its box runs
 * its own update (and never submits the item form around it).
 */
function OutOfService({ item, onSaved }: { item: RentalItem; onSaved: () => void }) {
  const { t } = useTranslation();
  const { number } = useFormatters();
  const notice = useNotice();
  const canWrite = usePermission("rental:write");
  const [value, setValue] = useState(String(item.unitsOutOfService));
  const update = useAsyncAction((units: number) => rentalAdminService.setUnitsOutOfService(item.id, units), {
    onSuccess: () => {
      notice.success(t("rental.outOfServiceSaved"));
      onSaved();
    },
  });
  const submit = () => void update.run(count(value));

  return (
    <FormSection title={t("field.outOfService")} description={t("rental.outOfServiceHint")}>
      <div role="group" aria-label={t("field.outOfService")}>
        {update.error && update.error.code !== "validation" ? <FormError error={update.error} /> : null}
        <div className="flex flex-wrap items-start gap-3">
          <Field
            name="unitsOutOfService"
            label={t("field.outOfService")}
            error={update.fieldErrors?.unitsOutOfService}
            className="mb-0 w-40"
          >
            {(props) => (
              <Input
                {...props}
                dir="ltr"
                type="number"
                min={0}
                max={item.totalUnits}
                step={1}
                disabled={!canWrite}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  submit();
                }}
              />
            )}
          </Field>
          <Button
            type="button"
            variant="outline"
            className="mt-7"
            disabled={!canWrite || update.isPending}
            onClick={submit}
          >
            {update.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {update.isPending ? t("action.saving") : t("rental.outOfServiceUpdate")}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("rental.availableOf", {
            available: number(item.totalUnits - item.unitsOutOfService),
            total: number(item.totalUnits),
          })}
        </p>
      </div>
    </FormSection>
  );
}
