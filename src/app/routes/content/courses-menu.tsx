import { ExternalLink, Loader2, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { ListEmpty, PaginationControls } from "@/components/data-table";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { Field, FormActions, FormError, FormSection, LocalizedField } from "@/components/form";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldDescription,
  FieldError,
  Input,
  Label,
  NativeSelect,
  NativeSelectOption,
  PageHeader,
  StatusBadge,
  Switch,
} from "@/components/ui";
import { appConfig } from "@/config";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  COURSES_MENU_KEY,
  menuPagePath,
  menusAdminService,
  type Menu,
  type MenuDraft,
  type MenuGroup,
  type MenuItem,
  type MenuPage,
} from "@/features/menus";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { LOCALES, LOCALE_DIRECTION, LOCALE_LABELS, useFormatters, useTranslation } from "@/i18n";

import { ReorderButtons } from "./reorder-buttons";

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

/** Pages per page of the side list: it sits beside the menu, so it stays short. */
const PAGES_PAGE_SIZE = 10;
const empty = { en: "", ar: "" };

/** Swaps an entry with its neighbour; the arrays' order IS the menu's order. */
function move<T>(list: readonly T[], index: number, by: -1 | 1): T[] {
  const next = [...list];
  const target = index + by;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/** What "Remove …?" is asking about. The name is kept so the dialog does not change while it closes. */
type Removal =
  | { readonly kind: "group"; readonly g: number; readonly name: string; readonly links: number }
  | { readonly kind: "item"; readonly g: number; readonly i: number; readonly name: string };

/**
 * One link in a column, as a compact row: its place, its label in each
 * language, where it goes and whether it is shown — then the buttons that move
 * or remove it. A column of links reads as a list, not a stack of forms.
 *
 * Each control carries the `field-<key>` id the error summary links to, and
 * the keys are the service's own (`groups.0.items.2.label.en`, `….href`, `….page`).
 */
function ItemRow({
  item,
  index,
  count,
  at,
  pages,
  fieldErrors,
  disabled,
  onChange,
  onMove,
  onRemove,
}: {
  item: MenuItem;
  index: number;
  count: number;
  /** The item's path in the draft — the prefix of its `fieldErrors` keys. */
  at: string;
  pages: readonly MenuPage[];
  fieldErrors?: Readonly<Record<string, string>>;
  disabled: boolean;
  onChange: (next: MenuItem) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: (name: string) => void;
}) {
  const { t, locale } = useTranslation();
  const { number } = useFormatters();
  const name =
    (item.label[locale] ?? "").trim() || (item.label.en ?? "").trim() || t("menus.link", { number: String(index + 1) });
  const visibleId = `menu-item-${item.id}-visible`;
  const opensId = `menu-item-${item.id}-opens`;
  const targetKey = item.target.kind === "page" ? `${at}.page` : `${at}.href`;
  const pathHintId = `field-${at}.href-hint`;
  /* Every message for this row, in the order its controls appear. */
  const errors = [...LOCALES.map((entry) => `${at}.label.${entry}`), targetKey]
    .map((key) => ({ key, message: fieldErrors?.[key] }))
    .filter((entry): entry is { key: string; message: string } => Boolean(entry.message));

  return (
    <li
      data-hidden={item.isVisible ? undefined : true}
      className="rounded-lg border bg-card p-3 transition-colors data-[hidden=true]:bg-muted/40"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md border bg-background text-xs font-medium text-muted-foreground tabular-nums"
        >
          {number(index + 1)}
        </span>

        <div className="grid min-w-0 flex-1 gap-2">
          {/* The label in each language, side by side; each box sets its own direction. */}
          <div className="grid gap-2 sm:grid-cols-2">
            {LOCALES.map((entry) => {
              const key = `${at}.label.${entry}`;
              const id = `field-${key}`;
              return (
                <div key={entry} dir={LOCALE_DIRECTION[entry]} className="relative">
                  <Label htmlFor={id} className="sr-only">
                    {`${t("menus.linkLabel")} — ${LOCALE_LABELS[entry]}`}
                  </Label>
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {entry}
                  </span>
                  <Input
                    id={id}
                    lang={entry}
                    dir={LOCALE_DIRECTION[entry]}
                    required
                    aria-invalid={fieldErrors?.[key] ? true : undefined}
                    aria-describedby={fieldErrors?.[key] ? `${id}-error` : undefined}
                    placeholder={t("menus.linkLabel")}
                    className="scroll-mt-24 ps-9"
                    value={item.label[entry] ?? ""}
                    onChange={(event) => onChange({ ...item, label: { ...item.label, [entry]: event.target.value } })}
                  />
                </div>
              );
            })}
          </div>

          <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center">
            <Label htmlFor={opensId} className="sr-only">
              {t("menus.opens")}
            </Label>
            <NativeSelect
              id={opensId}
              value={item.target.kind}
              onChange={(event) =>
                onChange({
                  ...item,
                  target:
                    event.target.value === "page"
                      ? { kind: "page", pageId: pages[0]?.id ?? "" }
                      : { kind: "link", href: "/" },
                })
              }
            >
              <NativeSelectOption value="page">{t("menus.opensPage")}</NativeSelectOption>
              <NativeSelectOption value="link">{t("menus.opensLink")}</NativeSelectOption>
            </NativeSelect>

            {item.target.kind === "page" ? (
              <div className="min-w-0">
                <Label htmlFor={`field-${at}.page`} className="sr-only">
                  {t("menus.page")}
                </Label>
                <NativeSelect
                  id={`field-${at}.page`}
                  className="scroll-mt-24"
                  aria-invalid={fieldErrors?.[`${at}.page`] ? true : undefined}
                  aria-describedby={fieldErrors?.[`${at}.page`] ? `field-${at}.page-error` : undefined}
                  value={item.target.pageId}
                  onChange={(event) => onChange({ ...item, target: { kind: "page", pageId: event.target.value } })}
                >
                  {pages.map((entry) => (
                    <NativeSelectOption key={entry.id} value={entry.id}>
                      {entry.title[locale] || entry.title.en}
                      {entry.status === "draft" ? ` (${t("pages.draft")})` : ""}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : (
              <div className="min-w-0">
                <Label htmlFor={`field-${at}.href`} className="sr-only">
                  {t("menus.path")}
                </Label>
                <Input
                  id={`field-${at}.href`}
                  dir="ltr"
                  title={t("menus.pathHint")}
                  className="scroll-mt-24 font-mono"
                  aria-invalid={fieldErrors?.[`${at}.href`] ? true : undefined}
                  aria-describedby={
                    [pathHintId, fieldErrors?.[`${at}.href`] ? `field-${at}.href-error` : ""].filter(Boolean).join(" ")
                  }
                  value={item.target.href}
                  onChange={(event) => onChange({ ...item, target: { kind: "link", href: event.target.value } })}
                />
              </div>
            )}

            <div className="flex items-center gap-2 sm:justify-end">
              <Switch
                id={visibleId}
                aria-describedby={`${visibleId}-hint`}
                checked={item.isVisible}
                onCheckedChange={(isVisible) => onChange({ ...item, isVisible })}
              />
              <Label htmlFor={visibleId} className="font-normal whitespace-nowrap">
                {t("menus.visible")}
              </Label>
              <span id={`${visibleId}-hint`} className="sr-only">
                {t("menus.visibleHint")}
              </span>
            </div>
          </div>

          {/* Read out with the path box; shown once per row would repeat down the whole column. */}
          {item.target.kind === "link" ? (
            <FieldDescription id={pathHintId} className="sr-only">
              {t("menus.pathHint")}
            </FieldDescription>
          ) : null}
          {errors.map((entry) => (
            <FieldError key={entry.key} id={`field-${entry.key}-error`}>
              {entry.message}
            </FieldError>
          ))}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <ReorderButtons
            index={index}
            count={count}
            name={name}
            disabled={disabled}
            onMove={onMove}
            onRemove={() => onRemove(name)}
          />
          {item.isVisible ? null : <Badge variant="secondary">{t("menus.hidden")}</Badge>}
        </div>
      </div>
    </li>
  );
}


/** The error summary names each field the way the form does: "Column 2 · Link 1 · Label — English". */
function errorLabels(draft: MenuDraft, t: ReturnType<typeof useTranslation>["t"]): Record<string, string> {
  const labels: Record<string, string> = { href: t("menus.menuLink") };
  const localized = (key: string, label: string) => {
    for (const locale of LOCALES) labels[`${key}.${locale}`] = `${label} — ${LOCALE_LABELS[locale]}`;
  };
  localized("label", t("menus.menuName"));
  draft.groups.forEach((group, g) => {
    const column = t("menus.column", { number: String(g + 1) });
    localized(`groups.${g}.label`, `${column} · ${t("menus.columnName")}`);
    group.items.forEach((_, i) => {
      const at = `groups.${g}.items.${i}`;
      const link = `${column} · ${t("menus.link", { number: String(i + 1) })}`;
      localized(`${at}.label`, `${link} · ${t("menus.linkLabel")}`);
      labels[`${at}.href`] = `${link} · ${t("menus.path")}`;
      labels[`${at}.page`] = `${link} · ${t("menus.page")}`;
    });
  });
  return labels;
}

function MenuEditor({
  menu,
  pages,
  aside,
  onSaved,
}: {
  menu: Menu;
  pages: readonly MenuPage[];
  /** The pages list, beside the menu on a wide screen. */
  aside: ReactNode;
  onSaved: () => void;
}) {
  const { t, locale } = useTranslation();
  const { number } = useFormatters();
  const canWrite = usePermission("content:write");
  const notice = useNotice();
  const [draft, setDraft] = useState<MenuDraft>({ label: menu.label, href: menu.href, groups: menu.groups });
  const [removing, setRemoving] = useState<Removal | null>(null);
  const save = useAsyncAction((next: MenuDraft) => menusAdminService.saveMenu(COURSES_MENU_KEY, next), {
    onSuccess: () => {
      notice.success(t("crud.updated"));
      onSaved();
    },
  });

  const setGroups = (groups: readonly MenuGroup[]) => setDraft({ ...draft, groups });
  const setGroup = (index: number, group: MenuGroup) =>
    setGroups(draft.groups.map((entry, i) => (i === index ? group : entry)));

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.run(draft);
        }}
      >
        <FormError error={save.error} labels={errorLabels(draft, t)} />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection title={t("menus.headingTitle")} description={t("menus.headingHint")}>
              <LocalizedField
                name="label"
                label={t("menus.menuName")}
                value={draft.label}
                onChange={(label) => setDraft({ ...draft, label })}
                fieldErrors={save.fieldErrors}
                required
              />
              <Field
                name="href"
                label={t("menus.menuLink")}
                hint={t("menus.pathHint")}
                error={save.fieldErrors?.href}
                className="mb-0"
              >
                {(props) => (
                  <Input
                    {...props}
                    dir="ltr"
                    className="font-mono sm:max-w-sm"
                    value={draft.href}
                    onChange={(event) => setDraft({ ...draft, href: event.target.value })}
                  />
                )}
              </Field>
            </FormSection>

            <section aria-labelledby="menu-columns-heading" className="flex flex-col gap-4">
              <div className="space-y-1">
                <h2 id="menu-columns-heading" className="text-base font-semibold">
                  {t("menus.columns")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("menus.columnsHint")}</p>
              </div>

              {draft.groups.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("menus.noColumns")}
                </p>
              ) : null}

              {draft.groups.map((group, g) => {
                const position = t("menus.column", { number: String(g + 1) });
                const name = (group.label[locale] ?? "").trim() || (group.label.en ?? "").trim();
                const links = t("menus.linkCount", { count: number(group.items.length) });
                return (
                  <FormSection
                    key={group.id}
                    title={name || position}
                    description={name ? `${position} · ${links}` : links}
                    actions={
                      <ReorderButtons
                        index={g}
                        count={draft.groups.length}
                        name={name || position}
                        removeLabel={t("menus.removeColumn")}
                        disabled={!canWrite}
                        onMove={(by) => setGroups(move(draft.groups, g, by))}
                        onRemove={() =>
                          setRemoving({ kind: "group", g, name: name || position, links: group.items.length })
                        }
                      />
                    }
                  >
                    <LocalizedField
                      name={`groups.${g}.label`}
                      label={t("menus.columnName")}
                      value={group.label}
                      onChange={(label) => setGroup(g, { ...group, label })}
                      fieldErrors={save.fieldErrors}
                      required
                    />

                    {group.items.length === 0 ? (
                      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                        {t("menus.noLinks")}
                      </p>
                    ) : (
                      <ol className="flex flex-col gap-3">
                        {group.items.map((item, i) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            index={i}
                            count={group.items.length}
                            at={`groups.${g}.items.${i}`}
                            pages={pages}
                            fieldErrors={save.fieldErrors}
                            disabled={!canWrite}
                            onChange={(next) =>
                              setGroup(g, { ...group, items: group.items.map((entry, j) => (j === i ? next : entry)) })
                            }
                            onMove={(by) => setGroup(g, { ...group, items: move(group.items, i, by) })}
                            onRemove={(itemName) => setRemoving({ kind: "item", g, i, name: itemName })}
                          />
                        ))}
                      </ol>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      disabled={!canWrite}
                      onClick={() =>
                        setGroup(g, {
                          ...group,
                          items: [
                            ...group.items,
                            {
                              id: newId("mi"),
                              label: empty,
                              isVisible: true,
                              target: pages[0] ? { kind: "page", pageId: pages[0].id } : { kind: "link", href: "/" },
                            },
                          ],
                        })
                      }
                    >
                      <Plus /> {t("menus.addLink")}
                    </Button>
                  </FormSection>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full border-dashed"
                disabled={!canWrite}
                onClick={() => setGroups([...draft.groups, { id: newId("mg"), label: empty, items: [] }])}
              >
                <Plus /> {t("menus.addColumn")}
              </Button>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-16">{aside}</div>
        </div>

        <FormActions
          start={
            save.result ? (
              <p role="status" className="text-sm font-medium text-foreground">
                {t("state.saved")}
              </p>
            ) : null
          }
        >
          <Button type="submit" disabled={!canWrite || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {save.isPending ? t("action.saving") : t("menus.save")}
          </Button>
        </FormActions>
      </form>

      {/* Removing only changes the draft — nothing reaches the site until Save —
          but a column takes its links with it, so both ask first. */}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? t("menus.removeTitle", { name: removing.name }) : ""}
        description={
          removing?.kind === "group"
            ? t("menus.removeColumnBody", { count: number(removing.links) })
            : t("menus.removeLinkBody")
        }
        confirmLabel={t("menus.remove")}
        onConfirm={async () => {
          if (!removing) return;
          if (removing.kind === "group") {
            setGroups(draft.groups.filter((_, i) => i !== removing.g));
          } else {
            const group = draft.groups[removing.g];
            if (group) setGroup(removing.g, { ...group, items: group.items.filter((_, j) => j !== removing.i) });
          }
        }}
      />
    </>
  );
}

/**
 * The managed pages, a page at a time from the API. The page number is this
 * list's own state, not the URL's: the URL belongs to the menu beside it.
 */
function PageList() {
  const { t, locale } = useTranslation();
  const { dateTime } = useFormatters();
  const canWrite = usePermission("content:write");
  const site = appConfig.storefrontUrl.replace(/\/+$/, "");
  const [listPage, setListPage] = useState(1);
  const state = useAsyncData(
    () => menusAdminService.listPagesPage({ page: listPage, pageSize: PAGES_PAGE_SIZE, locale }),
    [listPage, locale],
  );

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b">
        <CardTitle>{t("menus.pages")}</CardTitle>
        <CardDescription>{t("menus.pagesHint")}</CardDescription>
        {canWrite ? (
          <CardAction>
            <Button asChild size="sm" variant="outline">
              <Link to="/content/menu/pages/new">
                <Plus /> {t("menus.newPage")}
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={4}>
        {({ items: pages, meta }) => (
          <div>
            {pages.length === 0 ? (
              <ListEmpty label={t("menus.noPages")} />
            ) : (
              <ul className="divide-y">
                {pages.map((page) => (
                  <li key={page.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <Link
                        to={`/content/menu/pages/${page.id}`}
                        dir="auto"
                        className="block truncate text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {page.title[locale] || page.title.en}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        <span dir="ltr" className="font-mono">
                          {menuPagePath(page.slug)}
                        </span>
                        {` · ${dateTime(page.updatedAt)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={page.status} />
                      {page.status === "published" ? (
                        <a
                          href={`${site}/${locale}${menuPagePath(page.slug)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          {t("menus.viewOnSite")}
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t px-4 py-3">
              <PaginationControls meta={meta} onPageChange={setListPage} />
            </div>
          </div>
        )}
      </AsyncBoundary>
    </Card>
  );
}

/**
 * CONTENT → COURSES MENU.
 *
 * The storefront's "Courses" dropdown, edited as one document: its name, its
 * columns in order, the links in each column in order, and where each link
 * goes — one of the pages beside it or any path on the site. Saving replaces
 * the whole menu, so what staff see here is exactly what the header will show.
 */
export function CoursesMenuRoute() {
  const { t } = useTranslation();
  /* Every page, for the links' page picker; the side list reads its own pages. */
  const state = useAsyncData(
    async () => {
      const [menu, pages] = await Promise.all([
        menusAdminService.getMenu(COURSES_MENU_KEY),
        menusAdminService.listPages(),
      ]);
      return { menu, pages };
    },
    [],
  );

  return (
    <RequirePermission permission="content:read">
      <PageHeader title={t("menus.title")} description={t("menus.description")} />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={6}>
        {({ menu, pages }) =>
          /* Keyed by the menu, not its timestamp: a save refetches, and remounting
             the editor would wipe the "Saved" confirmation it just showed. */
          menu ? (
            <MenuEditor key={menu.key} menu={menu} pages={pages} aside={<PageList />} onSaved={state.refetch} />
          ) : (
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <StateMessage title={t("state.empty")} />
              <div className="xl:sticky xl:top-16">
                <PageList />
              </div>
            </div>
          )
        }
      </AsyncBoundary>
    </RequirePermission>
  );
}
