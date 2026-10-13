import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  Badge,
  Button,
  Input,
  NativeSelect,
  NativeSelectOption,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { appConfig } from "@/config";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  catalogueService,
  PRODUCT_MEDIA_MAX,
  type AdminProduct,
  type Brand,
  type NewProductVariant,
  type ProductCategory,
  type ProductDraft,
} from "@/features/catalogue";
import { sportsService, type Sport } from "@/features/sports";
import { useAsyncAction, useAsyncData, useUnsavedGuard } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import { parseMoneyInput } from "@/lib";
import type { PublishStatus } from "@/types";

import { BackLink } from "../../components/record-parts";

const empty = { en: "", ar: "" };

/* A new product starts as a draft, so it can be saved half-written and
   published once both languages are in. */
const BLANK: ProductDraft = {
  title: empty,
  summary: empty,
  description: empty,
  status: "draft",
  brandId: "",
  categoryIds: [],
  sportIds: [],
  media: [],
};

/* The first variant as typed: strings, so a half-typed price is not coerced. */
interface VariantInput {
  readonly sku: string;
  readonly price: string;
  readonly stock: string;
}
const BLANK_VARIANT: VariantInput = { sku: "", price: "", stock: "0" };

/* Unparseable input goes to the service as a value it will refuse, so the
   message comes from the same place as every other rule. */
function toVariant(input: VariantInput): NewProductVariant {
  const currency = appConfig.defaultCurrency;
  return {
    sku: input.sku.trim(),
    price: parseMoneyInput(input.price, currency) ?? { amount: 0, currency },
    stockOnHand: input.stock.trim() === "" ? 0 : Number(input.stock),
  };
}

function toDraft(product: AdminProduct): ProductDraft {
  return {
    title: product.title,
    summary: product.summary,
    description: product.description,
    status: product.status,
    brandId: product.brandId,
    categoryIds: product.categoryIds,
    sportIds: product.sportIds,
    media: product.media,
    seo: product.seo,
  };
}

interface Choices {
  readonly categories: readonly ProductCategory[];
  readonly brands: readonly Brand[];
  readonly sports: readonly Sport[];
}

/**
 * One form for a new product and an existing one. It holds a `ProductDraft` —
 * the editable subset — so saving can never overwrite stock, audit fields or
 * ratings, none of which this screen edits. A new product also gets its first
 * variant (SKU, price, opening stock); after that, stock moves by adjustment.
 *
 * Validation errors come back from the service keyed `field.locale`, and
 * `LocalizedField` places each one on the right language box.
 *
 * Photos upload the moment they are picked (each to `mediaService`) and the
 * gallery is saved with the rest of the draft, in its order — the first is
 * the cover — so a new product can be created with its pictures in one go.
 */
function ProductEditor({
  product,
  choices,
  onSaved,
}: {
  product: AdminProduct | null;
  choices: Choices;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { text, money, number, dateTime } = useFormatters();
  const navigate = useNavigate();
  const notice = useNotice();
  const canWrite = usePermission("catalogue:write");
  const noun = t("products.noun");

  // Seeded once. The parent remounts this component (via `key`) when a save
  // returns a new version, which is React's own answer to "reset state when the
  // input changes" — cheaper and less error-prone than syncing in an effect.
  const [draft, setDraft] = useState<ProductDraft>(() => (product ? toDraft(product) : BLANK));
  const [baseline] = useState<ProductDraft>(() => (product ? toDraft(product) : BLANK));
  const [variant, setVariant] = useState<VariantInput>(BLANK_VARIANT);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = useAsyncAction(
    (input: ProductDraft) =>
      product
        ? catalogueService.updateProduct(product.id, input)
        : catalogueService.createProduct({ ...input, variant: toVariant(variant) }),
    {
      onSuccess: (saved) => {
        if (product) {
          notice.success(t("crud.updated"));
          onSaved();
        } else {
          notice.success(t("crud.created", { noun }));
          navigate(`/catalogue/products/${saved.id}`, { replace: true });
        }
      },
    },
  );

  /*
   * The draft lives in component state, so leaving the screen discards it.
   * Comparing against the record as loaded means the guard turns itself off
   * again when someone undoes their own edit — a dirty flag that only ever goes
   * one way trains people to click through it. It is also off while "Delete?"
   * is open: that decides the draft's fate, and a deleted product's edits have
   * nowhere to be saved.
   */
  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(baseline) ||
    (!product && JSON.stringify(variant) !== JSON.stringify(BLANK_VARIANT));
  const blocker = useUnsavedGuard(isDirty && !save.isPending && !confirmingDelete);
  const fieldErrors = save.fieldErrors;

  return (
    <>
      <UnsavedDialog blocker={blocker} />
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.run(draft);
        }}
      >
        {/* At the top, where it is seen without scrolling back. The fields keep
            their own inline messages; this is the map to them. */}
        <FormError
          error={save.error}
          labels={{
            "title.en": `${t("field.title")} — English`,
            "title.ar": `${t("field.title")} — العربية`,
            "summary.en": `${t("field.summary")} — English`,
            "summary.ar": `${t("field.summary")} — العربية`,
            "description.en": `${t("field.description")} — English`,
            "description.ar": `${t("field.description")} — العربية`,
            brandId: t("field.brand"),
            categoryIds: t("field.categories"),
            "variant.sku": t("products.sku"),
            "variant.price": t("field.price"),
            "variant.stockOnHand": t("products.openingStock"),
            media: t("products.photos"),
          }}
        />

        {/* Content on the main side; how it is filed and shown on the side —
            the two things staff edit at different moments. */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection title={t("section.content")} description={t("section.contentHint")}>
              <LocalizedField
                name="title"
                label={t("field.title")}
                value={draft.title}
                onChange={(title) => setDraft({ ...draft, title })}
                fieldErrors={fieldErrors}
                required
              />
              <LocalizedField
                name="summary"
                label={t("field.summary")}
                value={draft.summary}
                onChange={(summary) => setDraft({ ...draft, summary })}
                fieldErrors={fieldErrors}
                required
              />
              <LocalizedField
                name="description"
                label={t("field.description")}
                value={draft.description}
                onChange={(description) => setDraft({ ...draft, description })}
                fieldErrors={fieldErrors}
                multiline
              />
            </FormSection>

            <FormSection title={t("products.images")} description={t("products.imagesDescription")}>
              <ImageGalleryField
                name="media"
                label={t("products.photos")}
                hint={t("products.photosHint")}
                value={draft.media}
                /* Functional: an upload finishes after the render that started it,
                   and must not undo what was typed meanwhile. */
                onChange={(media) => setDraft((current) => ({ ...current, media }))}
                purpose="product"
                max={PRODUCT_MEDIA_MAX}
                error={fieldErrors?.media}
                disabled={!canWrite}
              />
            </FormSection>

            {product ? null : (
              <FormSection title={t("products.firstVariant")} description={t("products.firstVariantHint")}>
                <div className="grid gap-x-4 sm:grid-cols-3">
                  <Field name="variant.sku" label={t("products.sku")} error={fieldErrors?.["variant.sku"]} required>
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        className="font-mono"
                        value={variant.sku}
                        onChange={(event) => setVariant({ ...variant, sku: event.target.value })}
                      />
                    )}
                  </Field>
                  <Field
                    name="variant.price"
                    label={t("field.price")}
                    hint={t("products.priceHint", { currency: appConfig.defaultCurrency })}
                    error={fieldErrors?.["variant.price"]}
                    required
                  >
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        inputMode="decimal"
                        placeholder="0.000"
                        value={variant.price}
                        onChange={(event) => setVariant({ ...variant, price: event.target.value })}
                      />
                    )}
                  </Field>
                  <Field
                    name="variant.stockOnHand"
                    label={t("products.openingStock")}
                    hint={t("products.openingStockHint")}
                    error={fieldErrors?.["variant.stockOnHand"]}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        type="number"
                        min={0}
                        step={1}
                        value={variant.stock}
                        onChange={(event) => setVariant({ ...variant, stock: event.target.value })}
                      />
                    )}
                  </Field>
                </div>
              </FormSection>
            )}

            {product ? (
              <FormSection
                title={t("products.stockTitle")}
                description={`${t("field.updated")}: ${dateTime(product.audit.updatedAt)}`}
              >
                {/*
                  Stock is not drawn as a bar. A count and a reserve line do not
                  divide a whole between them the way rental units do, and a bar
                  would invent a proportion that is not there. What matters is
                  whether a variant has crossed its line, so the row says so in
                  words and carries the colour that means "already going wrong".
                */}
                <ul className="divide-y text-sm">
                  {product.variants.map((entry) => {
                    const low = entry.stockOnHand <= entry.lowStockThreshold;
                    return (
                      <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                        <span className="font-medium">{entry.title}</span>
                        <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                          {entry.sku}
                        </span>
                        <span data-figure>{money(entry.price)}</span>
                        <Badge variant={low ? "destructive" : "secondary"}>
                          <span data-figure>{`${t("products.onHand")}: ${number(entry.stockOnHand)}`}</span>
                          {low ? ` · ${t("products.lowStock")}` : ""}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              </FormSection>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-16">
            <FormSection title={t("section.visibility")} description={t("section.visibilityHint")}>
              <Field label={t("field.status")} className="mb-0">
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={draft.status}
                    onChange={(event) => setDraft({ ...draft, status: event.target.value as PublishStatus })}
                  >
                    {(["draft", "published", "archived"] as const).map((status) => (
                      <NativeSelectOption key={status} value={status}>
                        {t(`statusLabel.${status}`)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            </FormSection>

            <FormSection title={t("section.organisation")} description={t("section.organisationHint")}>
              <Field name="brandId" label={t("field.brand")} error={fieldErrors?.brandId} required>
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={draft.brandId}
                    onChange={(event) => setDraft({ ...draft, brandId: event.target.value })}
                  >
                    <NativeSelectOption value="">{t("products.brandPlaceholder")}</NativeSelectOption>
                    {/* A brand is a proper noun: shown as stored, in either language. */}
                    {choices.brands.map((brand) => (
                      <NativeSelectOption key={brand.id} value={brand.id}>
                        {brand.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <CheckboxGroupField
                name="categoryIds"
                legend={t("field.categories")}
                hint={t("products.categoriesHint")}
                required
                columns={2}
                error={fieldErrors?.categoryIds}
                options={choices.categories.map((category) => ({ value: category.id, label: text(category.name) }))}
                value={draft.categoryIds}
                onChange={(categoryIds) => setDraft({ ...draft, categoryIds })}
              />
              <CheckboxGroupField
                name="sportIds"
                legend={t("field.sports")}
                hint={t("products.sportsHint")}
                columns={2}
                error={fieldErrors?.sportIds}
                options={choices.sports.map((sport) => ({ value: sport.id, label: text(sport.name) }))}
                value={draft.sportIds}
                onChange={(sportIds) => setDraft({ ...draft, sportIds })}
              />
            </FormSection>
          </div>
        </div>

        <FormActions
          start={
            product && canWrite ? (
              <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
                <Trash2 /> {t("crud.delete")}
              </Button>
            ) : null
          }
        >
          <Button type="button" variant="outline" onClick={() => navigate("/catalogue/products")}>
            {t("action.cancel")}
          </Button>
          <Button type="submit" disabled={!canWrite || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {save.isPending ? t("action.saving") : product ? t("action.save") : t("crud.create")}
          </Button>
        </FormActions>
      </form>

      {/* Refused while the product is on any order — the dialog stays open to
          say how many, and that archiving is the way to withdraw it. */}
      {product ? (
        <ConfirmDialog
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          title={t("crud.deleteTitle", { name: text(product.title) })}
          onConfirm={async () => {
            await catalogueService.deleteProduct(product.id);
            notice.success(t("crud.deleted", { name: text(product.title) }));
            navigate("/catalogue/products");
          }}
        />
      ) : null}
    </>
  );
}

/** Catalogue → a product (`/catalogue/products/new` creates one). */
export function ProductDetailRoute() {
  const { productId = "new" } = useParams();
  const { t } = useTranslation();
  const isNew = productId === "new";
  /* The pickers' choices load with the product, so the form never renders with
     a brand it cannot name. `forNew` travels with the data: after a create the
     address changes before the new record has loaded, and the screen must keep
     showing what it has rather than "not found". */
  const state = useAsyncData(async () => {
    const [product, categories, brands, sports] = await Promise.all([
      isNew ? Promise.resolve(null) : catalogueService.getProduct(productId),
      catalogueService.listCategories(),
      catalogueService.listBrands(),
      sportsService.list(),
    ]);
    return { forNew: isNew, product, choices: { categories, brands, sports } };
  }, [productId]);

  return (
    <RequirePermission permission={isNew ? "catalogue:write" : "catalogue:read"}>
      <BackLink to="/catalogue/products" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {({ forNew, product, choices }) =>
          forNew || product ? (
            <>
              <PageHeader
                title={product ? t("products.editTitle") : t("crud.newNoun", { noun: t("products.noun") })}
                actions={product ? <StatusBadge status={product.status} /> : undefined}
              />
              <ProductEditor
                key={product?.audit.updatedAt ?? "new"}
                product={product}
                choices={choices}
                onSaved={state.refetch}
              />
            </>
          ) : (
            <StateMessage tone="error" title={t("state.errorTitle")} />
          )
        }
      </AsyncBoundary>
    </RequirePermission>
  );
}
