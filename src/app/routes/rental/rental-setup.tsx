import { Loader2, Plus } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { CheckboxGroupField, Field, FormError, FormSection, LocalizedField } from "@/components/form";
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  NativeSelect,
  NativeSelectOption,
  PageHeader,
  SearchInput,
} from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  rentalAdminService,
  type RentalCategory,
  type RentalCategoryDraft,
  type RentalDepot,
  type RentalDepotDraft,
} from "@/features/rental";
import { sportsService, type Sport } from "@/features/sports";
import { useAsyncAction, useAsyncData, type AsyncDataState } from "@/hooks";
import { LOCALE_LABELS, useFormatters, useTranslation } from "@/i18n";
import { readNumberParam } from "@/lib";
import type { ListQuery, Paginated } from "@/types";

import { categoryTree, selfAndDescendants, slugify } from "./rental-helpers";

/**
 * The shape of the hire catalogue: the categories the storefront filters by and
 * the depots units are collected from.
 *
 * Two lists on one screen, so this is not `ReferenceEditor` — that one owns the
 * page's heading, and a screen has exactly one. Each section here is the same
 * behaviour in a card instead: "Add" in the section's header, a search box and
 * a pager of its own, "⋯ → Edit / Delete" on each row, the form in a dialog, a
 * refusal shown in the confirmation, a notice for every outcome.
 */
export function RentalSetupRoute() {
  const { t } = useTranslation();
  const canWrite = usePermission("rental:write");

  return (
    <>
      <PageHeader title={t("rental.setupTitle")} description={t("rental.setupDescription")} />
      <CategoriesSection canWrite={canWrite} />
      <DepotsSection canWrite={canWrite} />
    </>
  );
}

/* ---- one list's page and search, in the URL --------------------------------- */

/** Rows per page in each card: two tables share the screen. */
const SECTION_PAGE_SIZE = 10;

interface SectionQuery {
  readonly query: ListQuery<"name">;
  readonly setSearch: (term: string) => void;
  readonly setPage: (page: number) => void;
}

/**
 * `useListQuery` for one of several lists on a screen. Each keeps its page and
 * search under its own prefix — `?catPage=2&catQ=bike&depotQ=amman` — so paging
 * one table leaves the other where it was, and the view can still be shared.
 */
function useSectionQuery(prefix: string): SectionQuery {
  const [params, setParams] = useSearchParams();
  const { locale } = useTranslation();
  const pageKey = `${prefix}Page`;
  const searchKey = `${prefix}Q`;
  const page = readNumberParam(params, pageKey) ?? 1;
  const search = params.get(searchKey) ?? undefined;

  const query = useMemo<ListQuery<"name">>(
    () => ({ page, pageSize: SECTION_PAGE_SIZE, search, locale }),
    [page, search, locale],
  );

  /* Written against the latest URL, not this render's: both cards may write in
     the same moment, and neither may undo the other. */
  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          mutate(next);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const setSearch = useCallback(
    (term: string) =>
      update((next) => {
        if (term) next.set(searchKey, term);
        else next.delete(searchKey);
        next.delete(pageKey);
      }),
    [update, searchKey, pageKey],
  );

  const setPage = useCallback(
    (to: number) =>
      update((next) => {
        if (to > 1) next.set(pageKey, String(to));
        else next.delete(pageKey);
      }),
    [update, pageKey],
  );

  return { query, setSearch, setPage };
}

/**
 * A table's state that also waits for what its cells and its form read — the
 * whole category list for "under {parent}" and the parent picker, the sports.
 * The table shows once both are in, and "Try again" retries both.
 */
function waitingFor<TData>(state: AsyncDataState<TData>, other: AsyncDataState<unknown>): AsyncDataState<TData> {
  return {
    data: other.data === undefined ? undefined : state.data,
    error: state.error ?? other.error,
    isLoading: state.isLoading || other.isLoading,
    isRefreshing: state.isRefreshing || other.isRefreshing,
    refetch: () => {
      state.refetch();
      other.refetch();
    },
  };
}

/* ---- one editable list in a card -------------------------------------------- */

interface EditableSectionProps<TRow extends { readonly id: string }, TDraft> {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** "category" — for "Add category", "Edit category", "New category added." */
  readonly noun: string;
  /** The search box's label: "Search categories". */
  readonly searchLabel: string;
  readonly list: SectionQuery;
  /** The current page, as the service answered it. */
  readonly state: AsyncDataState<Paginated<TRow>>;
  readonly columns: readonly DataTableColumn<TRow>[];
  readonly canWrite: boolean;
  readonly nameOf: (row: TRow) => string;
  readonly empty: TDraft;
  readonly toDraft: (row: TRow) => TDraft;
  readonly create: (draft: TDraft) => Promise<unknown>;
  readonly update: (id: string, draft: TDraft) => Promise<unknown>;
  readonly remove: (id: string) => Promise<unknown>;
  readonly onChanged: () => void;
  /** Field key to label, for the error summary: `name.en` → "Name — English". */
  readonly errorLabels: Readonly<Record<string, string>>;
  readonly renderFields: (form: FieldsProps<TRow, TDraft>) => ReactNode;
}

interface FieldsProps<TRow, TDraft> {
  readonly draft: TDraft;
  readonly setDraft: (next: TDraft) => void;
  readonly fieldErrors: Readonly<Record<string, string>> | undefined;
  /** The row being edited; `null` while creating. */
  readonly editing: TRow | null;
}

function EditableSection<TRow extends { readonly id: string }, TDraft>({
  id,
  title,
  description,
  noun,
  searchLabel,
  list,
  state,
  columns,
  canWrite,
  nameOf,
  empty,
  toDraft,
  create,
  update,
  remove,
  onChanged,
  errorLabels,
  renderFields,
}: EditableSectionProps<TRow, TDraft>) {
  const { t } = useTranslation();
  const notice = useNotice();
  /* `null` = closed, `"new"` = creating, a row = editing that row. */
  const [editing, setEditing] = useState<TRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<TRow | null>(null);
  const { query, setSearch, setPage } = list;

  const withActions: readonly DataTableColumn<TRow>[] = canWrite
    ? [
        ...columns,
        {
          key: "actions",
          header: t("field.actions"),
          align: "end",
          render: (row) => (
            <RowActions
              label={nameOf(row)}
              canWrite={canWrite}
              onEdit={() => setEditing(row)}
              onDelete={() => setDeleting(row)}
            />
          ),
        },
      ]
    : columns;

  return (
    <>
      {/* The search, the table and the pager meet the card's edges on ruled
          strips of their own, as in a list card; the cells carry their own inset. */}
      <div id={id}>
        <FormSection
          title={title}
          description={description}
          className="pb-0"
          actions={
            canWrite ? (
              /* Not before the form's own lists are in: the parent picker and
                 the sports would open empty. */
              <Button size="sm" disabled={state.data === undefined} onClick={() => setEditing("new")}>
                <Plus /> {t("crud.addNoun", { noun })}
              </Button>
            ) : undefined
          }
        >
          <div className="-mx-4 flex flex-col">
            <div className="flex flex-wrap items-center gap-3 border-t px-4 py-3">
              <SearchInput label={searchLabel} value={query.search ?? ""} onChange={setSearch} />
            </div>
            <div className="border-t">
              <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={3}>
                {(page) => (
                  <div>
                    <DataTable
                      caption={title}
                      columns={withActions}
                      rows={page.items}
                      getRowKey={(row) => row.id}
                      emptyLabel={query.search ? undefined : t("state.empty")}
                    />
                    <div className="border-t px-4 py-3">
                      <PaginationControls meta={page.meta} onPageChange={setPage} />
                    </div>
                  </div>
                )}
              </AsyncBoundary>
            </div>
          </div>
        </FormSection>
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent closeLabel={t("crud.close")} className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? t("crud.newNoun", { noun }) : t("crud.editNoun", { noun })}
            </DialogTitle>
            <DialogDescription>
              {editing === "new" || editing === null ? t("crud.newHint") : nameOf(editing)}
            </DialogDescription>
          </DialogHeader>
          {editing !== null ? (
            <SectionForm<TRow, TDraft>
              key={editing === "new" ? "new" : editing.id}
              initial={editing === "new" ? empty : toDraft(editing)}
              editing={editing === "new" ? null : editing}
              errorLabels={errorLabels}
              renderFields={renderFields}
              submit={async (draft) => {
                if (editing === "new") {
                  await create(draft);
                  notice.success(t("crud.created", { noun }));
                } else {
                  await update(editing.id, draft);
                  notice.success(t("crud.updated"));
                }
                onChanged();
              }}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: nameOf(deleting) }) : ""}
        onConfirm={async () => {
          if (!deleting) return;
          await remove(deleting.id);
          notice.success(t("crud.deleted", { name: nameOf(deleting) }));
          onChanged();
        }}
      />
    </>
  );
}

function SectionForm<TRow, TDraft>({
  initial,
  editing,
  errorLabels,
  renderFields,
  submit,
  onDone,
}: {
  initial: TDraft;
  editing: TRow | null;
  errorLabels: Readonly<Record<string, string>>;
  renderFields: (form: FieldsProps<TRow, TDraft>) => ReactNode;
  submit: (draft: TDraft) => Promise<unknown>;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<TDraft>(initial);
  const save = useAsyncAction(submit, { onSuccess: onDone });

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        void save.run(draft);
      }}
    >
      <DialogBody>
        {/* Each field shows its own message; this lists only the ones with no field here. */}
        <FormError error={save.error} labels={errorLabels} summary={false} />
        {renderFields({ draft, setDraft, fieldErrors: save.fieldErrors, editing })}
      </DialogBody>
      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={save.isPending}>
            {t("action.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {save.isPending ? t("action.saving") : editing ? t("action.save") : t("crud.create")}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** "Name — English", "Name — العربية": how the error summary names a language box. */
function localizedLabels(key: string, label: string): Record<string, string> {
  return { [`${key}.en`]: `${label} — ${LOCALE_LABELS.en}`, [`${key}.ar`]: `${label} — ${LOCALE_LABELS.ar}` };
}

/* ---- categories ------------------------------------------------------------ */

const EMPTY_CATEGORY: RentalCategoryDraft = {
  slug: "",
  name: { en: "", ar: "" },
  description: { en: "", ar: "" },
  parentId: null,
  sportIds: [],
};

const NO_CATEGORIES: readonly RentalCategory[] = [];
const NO_SPORTS: readonly Sport[] = [];

function CategoriesSection({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const { text, number, list } = useFormatters();
  const section = useSectionQuery("cat");
  const page = useAsyncData(() => rentalAdminService.listCategoriesPage(section.query), [section.query]);
  /* The table is paged; a row's parent may sit on another page, and the parent
     picker offers every category — so the whole taxonomy is read as well, from
     the pickers' list. */
  const options = useAsyncData(() => Promise.all([rentalAdminService.listCategories(), sportsService.list()]), []);
  const [categories, sports] = options.data ?? [NO_CATEGORIES, NO_SPORTS];
  const byId = new Map(categories.map((category) => [category.id, category]));
  const onChanged = () => {
    page.refetch();
    options.refetch();
  };

  return (
    <EditableSection<RentalCategory, RentalCategoryDraft>
      id="categories"
      title={t("field.categories")}
      description={t("rental.categoriesDescription")}
      noun={t("rental.categoryNoun")}
      searchLabel={t("rental.searchCategories")}
      list={section}
      state={waitingFor(page, options)}
      canWrite={canWrite}
      nameOf={(category) => text(category.name)}
      columns={[
        {
          key: "name",
          header: t("field.name"),
          render: (category) => {
            const parent = category.parentId ? byId.get(category.parentId) : undefined;
            return (
              <span className="flex flex-col">
                <span className="font-medium">{text(category.name)}</span>
                {parent ? (
                  <span className="text-xs text-muted-foreground">
                    {t("rental.underParent", { parent: text(parent.name) })}
                  </span>
                ) : null}
              </span>
            );
          },
        },
        {
          /* Both languages at once, as on the sports screen: staff check a
             translation by reading the pair. */
          key: "ar",
          header: t("i18n.otherLanguage"),
          render: (category) => (
            <span lang="ar" dir="rtl" className="text-muted-foreground">
              {category.name.ar || "—"}
            </span>
          ),
        },
        { key: "slug", header: t("field.slug"), render: (category) => <code dir="ltr">{category.slug}</code> },
        {
          key: "sports",
          header: t("field.sports"),
          render: (category) => (
            <span className="text-muted-foreground">
              {list(
                sports
                  .filter((sport) => category.sportIds?.includes(sport.id))
                  .map((sport) => text(sport.name)),
              ) || "—"}
            </span>
          ),
        },
        {
          key: "items",
          header: t("rental.items"),
          align: "end",
          render: (category) => <span data-figure>{number(category.itemCount ?? 0)}</span>,
        },
      ]}
      empty={EMPTY_CATEGORY}
      toDraft={(category) => ({
        slug: category.slug,
        name: category.name,
        description: category.description ?? { en: "", ar: "" },
        parentId: category.parentId,
        sportIds: category.sportIds ?? [],
        /* No form field edits this yet (see RentalCategory.image's own doc
           comment), but it must still round-trip: `updateCategory` sends
           whatever `draft.image` holds, and the live PUT is a full replace —
           leaving this out would silently wipe an existing image on every
           unrelated save (confirmed live; see rental.http.ts toCategoryBody). */
        image: category.image,
      })}
      create={(draft) => rentalAdminService.createCategory(draft)}
      update={(id, draft) => rentalAdminService.updateCategory(id, draft)}
      remove={(id) => rentalAdminService.deleteCategory(id)}
      onChanged={onChanged}
      errorLabels={{
        ...localizedLabels("name", t("field.name")),
        ...localizedLabels("description", t("field.description")),
        slug: t("field.slug"),
        parentId: t("field.parent"),
        sportIds: t("field.sports"),
      }}
      renderFields={({ draft, setDraft, fieldErrors, editing }) => (
        <CategoryFields
          draft={draft}
          setDraft={setDraft}
          fieldErrors={fieldErrors}
          editing={editing}
          categories={categories}
          sports={sports}
        />
      )}
    />
  );
}

function CategoryFields({
  draft,
  setDraft,
  fieldErrors,
  editing,
  categories,
  sports,
}: FieldsProps<RentalCategory, RentalCategoryDraft> & {
  categories: readonly RentalCategory[];
  sports: readonly Sport[];
}) {
  const { t } = useTranslation();
  const { text } = useFormatters();
  /* The slug follows the English name on a new category until someone types in it. */
  const [slugTouched, setSlugTouched] = useState(editing !== null);
  /* A category cannot sit under itself or anything beneath it. */
  const blocked = editing ? selfAndDescendants(categories, editing.id) : new Set<string>();
  const parents = categoryTree(categories).filter((node) => !blocked.has(node.category.id));

  return (
    <>
      <LocalizedField
        name="name"
        label={t("field.name")}
        value={draft.name}
        onChange={(name) =>
          setDraft({ ...draft, name, ...(slugTouched ? {} : { slug: slugify(name.en) }) })
        }
        fieldErrors={fieldErrors}
        required
      />
      <Field name="slug" label={t("field.slug")} hint={t("field.slugHint")} error={fieldErrors?.slug} required>
        {(props) => (
          <Input
            {...props}
            dir="ltr"
            className="font-mono text-[0.8rem]"
            value={draft.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setDraft({ ...draft, slug: event.target.value.toLowerCase() });
            }}
          />
        )}
      </Field>
      <LocalizedField
        name="description"
        label={t("field.description")}
        value={draft.description ?? { en: "", ar: "" }}
        onChange={(description) => setDraft({ ...draft, description })}
        fieldErrors={fieldErrors}
        multiline
      />
      <Field name="parentId" label={t("field.parent")} hint={t("rental.parentHint")} error={fieldErrors?.parentId}>
        {(props) => (
          <NativeSelect
            {...props}
            value={draft.parentId ?? ""}
            onChange={(event) => setDraft({ ...draft, parentId: event.target.value || null })}
          >
            <NativeSelectOption value="">{t("field.none")}</NativeSelectOption>
            {parents.map(({ category, depth }) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {/* A select cannot indent, so depth is drawn with a leading dash. */}
                {`${"— ".repeat(depth)}${text(category.name)}`}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </Field>
      <CheckboxGroupField
        name="sportIds"
        legend={t("field.sports")}
        hint={t("rental.categorySportsHint")}
        error={fieldErrors?.sportIds}
        options={sports.map((sport) => ({ value: sport.id, label: text(sport.name) }))}
        value={draft.sportIds ?? []}
        onChange={(sportIds) => setDraft({ ...draft, sportIds })}
      />
    </>
  );
}

/* ---- depots ---------------------------------------------------------------- */

const EMPTY_DEPOT: RentalDepotDraft = {
  name: { en: "", ar: "" },
  city: { en: "", ar: "" },
  countryCode: "JO",
};

function DepotsSection({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation();
  const { text, number } = useFormatters();
  const section = useSectionQuery("depot");
  const page = useAsyncData(() => rentalAdminService.listDepotsPage(section.query), [section.query]);

  return (
    <EditableSection<RentalDepot, RentalDepotDraft>
      id="depots"
      title={t("rental.depots")}
      description={t("rental.depotsDescription")}
      noun={t("rental.depotNoun")}
      searchLabel={t("rental.searchDepots")}
      list={section}
      state={page}
      canWrite={canWrite}
      nameOf={(depot) => text(depot.name)}
      columns={[
        { key: "name", header: t("field.name"), render: (depot) => <span className="font-medium">{text(depot.name)}</span> },
        {
          key: "ar",
          header: t("i18n.otherLanguage"),
          render: (depot) => (
            <span lang="ar" dir="rtl" className="text-muted-foreground">
              {depot.name.ar || "—"}
            </span>
          ),
        },
        { key: "city", header: t("field.city"), render: (depot) => `${text(depot.city)} · ${depot.countryCode}` },
        {
          key: "items",
          header: t("rental.items"),
          align: "end",
          render: (depot) => <span data-figure>{number(depot.itemCount ?? 0)}</span>,
        },
        {
          key: "units",
          header: t("field.units"),
          align: "end",
          render: (depot) => <span data-figure>{number(depot.totalUnits ?? 0)}</span>,
        },
      ]}
      empty={EMPTY_DEPOT}
      toDraft={(depot) => ({ name: depot.name, city: depot.city, countryCode: depot.countryCode })}
      create={(draft) => rentalAdminService.createDepot(draft)}
      update={(id, draft) => rentalAdminService.updateDepot(id, draft)}
      remove={(id) => rentalAdminService.deleteDepot(id)}
      onChanged={page.refetch}
      errorLabels={{
        ...localizedLabels("name", t("field.name")),
        ...localizedLabels("city", t("field.city")),
        countryCode: t("rental.countryCode"),
      }}
      renderFields={({ draft, setDraft, fieldErrors }) => (
        <>
          <LocalizedField
            name="name"
            label={t("field.name")}
            value={draft.name}
            onChange={(name) => setDraft({ ...draft, name })}
            fieldErrors={fieldErrors}
            required
          />
          <LocalizedField
            name="city"
            label={t("field.city")}
            value={draft.city}
            onChange={(city) => setDraft({ ...draft, city })}
            fieldErrors={fieldErrors}
            required
          />
          <Field
            name="countryCode"
            label={t("rental.countryCode")}
            hint={t("rental.countryCodeHint")}
            error={fieldErrors?.countryCode}
            required
          >
            {(props) => (
              <Input
                {...props}
                dir="ltr"
                maxLength={2}
                autoComplete="country"
                className="w-24 font-mono uppercase"
                value={draft.countryCode}
                onChange={(event) => setDraft({ ...draft, countryCode: event.target.value.toUpperCase() })}
              />
            )}
          </Field>
        </>
      )}
    />
  );
}
