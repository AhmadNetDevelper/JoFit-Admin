import { Loader2, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { Field, FormError, ImageField, LocalizedField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Field as UiField,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { ListCard } from "@/components/ui/list-card";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { useAsyncAction, useAsyncData, useListQuery } from "@/hooks";
import { useTranslation } from "@/i18n";
import { paginate } from "@/lib";
import type { MediaPurpose } from "@/services";
import type { ListQuery, LocalizedText, MediaImage, Paginated } from "@/types";

import { ConfirmDialog } from "./confirm-dialog";
import { RowActions } from "./row-actions";

/**
 * ONE SCREEN FOR EVERY SIMPLE LIST OF THINGS STAFF MAINTAIN.
 *
 * Categories, brands, depots, specialisations, authors, sports: each is a
 * table of records with a name (often in both languages), perhaps a slug and
 * a description. Rather than eight hand-built screens that drift apart, each
 * is this component plus a list of fields — so every one of them adds, edits
 * and deletes the same way:
 *
 *   • "Add" in the header opens the form in a dialog; "⋯ → Edit" on a row
 *     opens it filled in. Validation errors come from the service and land on
 *     the field they belong to.
 *   • "⋯ → Delete" asks first. A refusal ("still used by 4 products") is shown
 *     in the confirmation itself.
 *   • Every outcome ends in a notice, and the table refreshes.
 *   • The list is paged and searchable, like every list in the admin: the
 *     page and the search term live in the URL and go to the service, which
 *     answers one page (`Paginated`) — the API pages it, not the browser.
 *
 * It knows nothing about any domain: the route hands it the service calls.
 */
export type ReferenceField<TDraft> =
  | {
      readonly kind: "localized" | "localizedMultiline";
      readonly key: keyof TDraft & string;
      readonly label: string;
      readonly required?: boolean;
      readonly hint?: string;
    }
  | {
      readonly kind: "text" | "slug";
      readonly key: keyof TDraft & string;
      readonly label: string;
      readonly required?: boolean;
      readonly hint?: string;
      /** For `slug`: the field (bilingual — its English — or plain text) that suggests the slug on a new record. */
      readonly from?: keyof TDraft & string;
    }
  | {
      readonly kind: "checkbox";
      readonly key: keyof TDraft & string;
      readonly label: string;
      readonly hint?: string;
    }
  | {
      readonly kind: "select";
      readonly key: keyof TDraft & string;
      readonly label: string;
      readonly options: readonly { readonly value: string; readonly label: string }[];
      readonly hint?: string;
    }
  | {
      /** One uploaded picture; the draft holds a `MediaImage` or undefined. */
      readonly kind: "image";
      readonly key: keyof TDraft & string;
      readonly label: string;
      readonly purpose: MediaPurpose;
      readonly hint?: string;
      readonly required?: boolean;
      readonly aspect?: "square" | "video" | "portrait" | "wide";
      /** `contain` for a logo; `cover` for a photograph. */
      readonly fit?: "cover" | "contain";
      /** Width of the preview, e.g. `max-w-40` for a small logo. */
      readonly className?: string;
    }
  | {
      /** A group of checkboxes; the draft holds the chosen values as a string array. */
      readonly kind: "multiselect";
      readonly key: keyof TDraft & string;
      readonly label: string;
      readonly options: readonly { readonly value: string; readonly label: string }[];
      readonly hint?: string;
    };

/**
 * The form's fields — a fixed list, or a function of the record being edited
 * (`null` when adding) for fields whose options depend on it, such as a
 * parent picker that must not offer the record itself.
 */
export type ReferenceFields<TRow, TDraft> =
  | readonly ReferenceField<TDraft>[]
  | ((editing: TRow | null) => readonly ReferenceField<TDraft>[]);

export interface ReferenceEditorProps<TRow extends { readonly id: string }, TDraft extends object> {
  readonly title: string;
  readonly description?: string;
  /** "category" — used in "New category", "Edit category". */
  readonly noun: string;
  /**
   * One page of rows for the query (page, page size, search, locale). A plain
   * array is still accepted and paged here, for a list that is fixed and short
   * — but every list backed by the API answers `Paginated`.
   */
  readonly load: (query: ListQuery) => Promise<Paginated<TRow> | readonly TRow[]>;
  readonly columns: readonly DataTableColumn<TRow>[];
  readonly fields: ReferenceFields<TRow, TDraft>;
  readonly empty: TDraft;
  readonly toDraft: (row: TRow) => TDraft;
  readonly create: (draft: TDraft) => Promise<unknown>;
  readonly update: (id: string, draft: TDraft) => Promise<unknown>;
  readonly remove: (id: string) => Promise<unknown>;
  /** How a record is named in notices and in "Delete …?". */
  readonly nameOf: (row: TRow) => string;
  readonly canWrite: boolean;
  /** Anything shown above the table (a filter, a hint). */
  readonly toolbar?: ReactNode;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

function ReferenceForm<TDraft extends object>({
  fields,
  initial,
  isNew,
  submit,
  onDone,
}: {
  fields: readonly ReferenceField<TDraft>[];
  initial: TDraft;
  isNew: boolean;
  submit: (draft: TDraft) => Promise<unknown>;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<TDraft>(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const save = useAsyncAction(submit, { onSuccess: onDone });
  const value = (key: string) => (draft as Record<string, unknown>)[key];
  const set = (key: string, next: unknown) => setDraft({ ...draft, [key]: next });
  /* A slug follows the field it is derived from (a bilingual name's English,
     or a plain-text name) until someone edits the slug by hand. */
  const slugFrom = (key: string, source: string) => {
    const slugField = fields.find((entry) => entry.kind === "slug" && entry.from === key);
    return slugField && !slugTouched ? { [slugField.key]: slugify(source) } : {};
  };
  /* The error summary names each field the way the form does: "Name — English". */
  const errorLabels = Object.fromEntries(
    fields.flatMap((field) =>
      field.kind === "localized" || field.kind === "localizedMultiline"
        ? [
            [`${field.key}.en`, `${field.label} — English`],
            [`${field.key}.ar`, `${field.label} — العربية`],
          ]
        : [[field.key, field.label]],
    ),
  );

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
        <FormError error={save.error} labels={errorLabels} summary={false} />
        {fields.map((field) => {
          switch (field.kind) {
            case "localized":
            case "localizedMultiline":
              return (
                <LocalizedField
                  key={field.key}
                  name={field.key}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  multiline={field.kind === "localizedMultiline"}
                  value={(value(field.key) as LocalizedText | undefined) ?? { en: "", ar: "" }}
                  onChange={(next) => setDraft({ ...draft, [field.key]: next, ...slugFrom(field.key, next.en) })}
                  fieldErrors={save.fieldErrors}
                />
              );
            case "text":
            case "slug":
              return (
                <Field
                  key={field.key}
                  name={field.key}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  error={save.fieldErrors?.[field.key]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      dir={field.kind === "slug" ? "ltr" : "auto"}
                      className={field.kind === "slug" ? "font-mono text-[0.8rem]" : undefined}
                      value={(value(field.key) as string | undefined) ?? ""}
                      onChange={(event) => {
                        if (field.kind === "slug") {
                          setSlugTouched(true);
                          set(field.key, event.target.value.toLowerCase());
                        } else {
                          setDraft({ ...draft, [field.key]: event.target.value, ...slugFrom(field.key, event.target.value) });
                        }
                      }}
                    />
                  )}
                </Field>
              );
            case "checkbox":
              /* A yes/no setting reads best as a switch with its explanation beside it. */
              return (
                <UiField key={field.key} orientation="horizontal" className="mb-5 rounded-xl border p-4">
                  <FieldContent>
                    <FieldLabel htmlFor={`field-${field.key}`}>{field.label}</FieldLabel>
                    {field.hint ? <FieldDescription>{field.hint}</FieldDescription> : null}
                  </FieldContent>
                  <Switch
                    id={`field-${field.key}`}
                    checked={Boolean(value(field.key))}
                    onCheckedChange={(checked) => set(field.key, checked)}
                  />
                </UiField>
              );
            case "select":
              return (
                <Field key={field.key} name={field.key} label={field.label} hint={field.hint} error={save.fieldErrors?.[field.key]}>
                  {(props) => (
                    <NativeSelect
                      {...props}
                      value={(value(field.key) as string | undefined) ?? ""}
                      onChange={(event) => set(field.key, event.target.value || null)}
                    >
                      {field.options.map((option) => (
                        <NativeSelectOption key={option.value} value={option.value}>
                          {option.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                </Field>
              );
            case "image":
              return (
                <ImageField
                  key={field.key}
                  name={field.key}
                  label={field.label}
                  hint={field.hint}
                  required={field.required}
                  purpose={field.purpose}
                  aspect={field.aspect}
                  fit={field.fit}
                  className={field.className}
                  value={value(field.key) as MediaImage | undefined}
                  onChange={(next) => set(field.key, next)}
                  error={save.fieldErrors?.[field.key]}
                />
              );
            case "multiselect": {
              const chosen = (value(field.key) as readonly string[] | undefined) ?? [];
              const error = save.fieldErrors?.[field.key];
              return (
                <FieldSet key={field.key} id={`field-${field.key}`} className="mb-5 gap-3 rounded-xl border p-4">
                  <FieldLegend variant="label" className="mb-0">
                    {field.label}
                  </FieldLegend>
                  {field.hint ? <FieldDescription>{field.hint}</FieldDescription> : null}
                  <div data-slot="checkbox-group" className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    {field.options.map((option) => {
                      const id = `field-${field.key}-${option.value}`;
                      return (
                        <UiField key={option.value} orientation="horizontal" className="gap-2">
                          <Checkbox
                            id={id}
                            checked={chosen.includes(option.value)}
                            onCheckedChange={(checked) =>
                              set(
                                field.key,
                                checked === true
                                  ? [...chosen, option.value]
                                  : chosen.filter((entry) => entry !== option.value),
                              )
                            }
                          />
                          <FieldLabel htmlFor={id} className="font-normal">
                            {option.label}
                          </FieldLabel>
                        </UiField>
                      );
                    })}
                  </div>
                  {error ? <FieldError>{error}</FieldError> : null}
                </FieldSet>
              );
            }
          }
        })}
      </DialogBody>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          {t("action.cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {save.isPending ? t("action.saving") : isNew ? t("crud.create") : t("action.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ReferenceEditor<TRow extends { readonly id: string }, TDraft extends object>({
  title,
  description,
  noun,
  load,
  columns,
  fields,
  empty,
  toDraft,
  create,
  update,
  remove,
  nameOf,
  canWrite,
  toolbar,
}: ReferenceEditorProps<TRow, TDraft>) {
  const { t } = useTranslation();
  const notice = useNotice();
  const { query, setSearch, setPage } = useListQuery();
  /* `load` is written inline by each screen, so it is read through the query
     alone — the query is memoised and is what identifies the request. */
  const state = useAsyncData(async () => {
    const result = await load(query);
    if (!Array.isArray(result)) return result as Paginated<TRow>;
    const term = query.search?.trim().toLowerCase();
    const rows = result as readonly TRow[];
    return paginate(term ? rows.filter((row) => nameOf(row).toLowerCase().includes(term)) : rows, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  /* `null` = closed, `"new"` = creating, a row = editing that row. */
  const [editing, setEditing] = useState<TRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<TRow | null>(null);

  const withActions: readonly DataTableColumn<TRow>[] = [
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
  ];

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          canWrite ? (
            <Button onClick={() => setEditing("new")}>
              <Plus /> {t("crud.addNoun", { noun })}
            </Button>
          ) : undefined
        }
      />
      {toolbar}
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(page) => (
          <ListCard
            toolbar={<SearchInput label={t("action.search")} value={query.search ?? ""} onChange={setSearch} />}
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={title}
              columns={withActions}
              rows={page.items}
              getRowKey={(row) => row.id}
              emptyLabel={query.search ? undefined : t("state.empty")}
            />
          </ListCard>
        )}
      </AsyncBoundary>

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
            <ReferenceForm
              key={editing === "new" ? "new" : editing.id}
              fields={typeof fields === "function" ? fields(editing === "new" ? null : editing) : fields}
              isNew={editing === "new"}
              initial={editing === "new" ? empty : toDraft(editing)}
              submit={async (draft) => {
                if (editing === "new") {
                  await create(draft);
                  notice.success(t("crud.created", { noun }));
                } else {
                  await update(editing.id, draft);
                  notice.success(t("crud.updated"));
                }
                state.refetch();
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
          state.refetch();
        }}
      />
    </>
  );
}
