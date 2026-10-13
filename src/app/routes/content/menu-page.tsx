import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { Field, FormActions, FormError, FormSection, LocalizedField } from "@/components/form";
import {
  Button,
  FieldContent,
  FieldDescription,
  FieldLabel,
  Input,
  PageHeader,
  Switch,
  Field as UiField,
} from "@/components/ui";
import { appConfig } from "@/config";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  menuPagePath,
  menusAdminService,
  type MenuPage,
  type MenuPageDraft,
  type MenuPageSection,
} from "@/features/menus";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { LOCALES, LOCALE_LABELS, useTranslation } from "@/i18n";

import { BackLink } from "../../components/record-parts";

import { ReorderButtons } from "./reorder-buttons";

const empty = { en: "", ar: "" };

const BLANK: MenuPageDraft = {
  slug: "",
  eyebrow: empty,
  title: empty,
  summary: empty,
  sections: [],
  status: "draft",
};

function toDraft(page: MenuPage): MenuPageDraft {
  const { id: _id, updatedAt: _updatedAt, ...draft } = page;
  return draft;
}

function PageEditor({ page }: { page: MenuPage | null }) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const canWrite = usePermission("content:write");
  const notice = useNotice();
  const [draft, setDraft] = useState<MenuPageDraft>(page ? toDraft(page) : BLANK);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  /* The section "Remove …?" is asking about; its name is kept so the dialog does not change while it closes. */
  const [removing, setRemoving] = useState<{ readonly index: number; readonly name: string } | null>(null);

  const save = useAsyncAction(
    (next: MenuPageDraft) => (page ? menusAdminService.updatePage(page.id, next) : menusAdminService.createPage(next)),
    {
      onSuccess: (saved) => {
        notice.success(page ? t("crud.updated") : t("crud.created", { noun: t("pages.noun") }));
        if (!page) navigate(`/content/menu/pages/${saved.id}`, { replace: true });
      },
    },
  );

  const setSections = (sections: readonly MenuPageSection[]) => setDraft({ ...draft, sections });
  const setSection = (index: number, section: MenuPageSection) =>
    setSections(draft.sections.map((entry, i) => (i === index ? section : entry)));
  const moveSection = (index: number, by: -1 | 1) => {
    const next = [...draft.sections];
    const target = index + by;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setSections(next);
  };
  const site = appConfig.storefrontUrl.replace(/\/+$/, "");

  /* The error summary names each field the way the form does: "Section 2 · Heading — English". */
  const labels: Record<string, string> = { slug: t("pages.slug") };
  const localized = (key: string, label: string) => {
    for (const entry of LOCALES) labels[`${key}.${entry}`] = `${label} — ${LOCALE_LABELS[entry]}`;
  };
  localized("eyebrow", t("pages.eyebrow"));
  localized("title", t("field.title"));
  localized("summary", t("field.summary"));
  localized("cta.label", t("pages.ctaLabel"));
  draft.sections.forEach((_, index) => {
    const section = t("pages.section", { number: String(index + 1) });
    localized(`sections.${index}.heading`, `${section} · ${t("pages.sectionHeading")}`);
    localized(`sections.${index}.body`, `${section} · ${t("pages.sectionBody")}`);
  });

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save.run(draft);
        }}
      >
        <FormError error={save.error} labels={labels} />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection title={t("section.content")} description={t("section.contentHint")}>
              <LocalizedField
                name="eyebrow"
                label={t("pages.eyebrow")}
                value={draft.eyebrow}
                onChange={(eyebrow) => setDraft({ ...draft, eyebrow })}
                fieldErrors={save.fieldErrors}
              />
              <LocalizedField
                name="title"
                label={t("field.title")}
                value={draft.title}
                onChange={(title) => setDraft({ ...draft, title })}
                fieldErrors={save.fieldErrors}
                required
              />
              <LocalizedField
                name="summary"
                label={t("field.summary")}
                value={draft.summary}
                onChange={(summary) => setDraft({ ...draft, summary })}
                fieldErrors={save.fieldErrors}
                multiline
                required
              />
            </FormSection>

            <section aria-labelledby="page-sections-heading" className="flex flex-col gap-4">
              <div className="space-y-1">
                <h2 id="page-sections-heading" className="text-base font-semibold">
                  {t("pages.sections")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("pages.sectionsHint")}</p>
              </div>

              {draft.sections.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("pages.noSections")}
                </p>
              ) : null}

              {draft.sections.map((section, index) => {
                const position = t("pages.section", { number: String(index + 1) });
                const heading = (section.heading[locale] ?? "").trim() || (section.heading.en ?? "").trim();
                return (
                  <FormSection
                    key={section.id}
                    title={heading || position}
                    description={heading ? position : undefined}
                    actions={
                      <ReorderButtons
                        index={index}
                        count={draft.sections.length}
                        name={heading || position}
                        disabled={!canWrite}
                        onMove={(by) => moveSection(index, by)}
                        onRemove={() => setRemoving({ index, name: heading || position })}
                      />
                    }
                  >
                    <LocalizedField
                      name={`sections.${index}.heading`}
                      label={t("pages.sectionHeading")}
                      value={section.heading}
                      onChange={(next) => setSection(index, { ...section, heading: next })}
                      fieldErrors={save.fieldErrors}
                      required
                    />
                    <LocalizedField
                      name={`sections.${index}.body`}
                      label={t("pages.sectionBody")}
                      hint={t("pages.sectionBodyHint")}
                      value={section.body}
                      onChange={(body) => setSection(index, { ...section, body })}
                      fieldErrors={save.fieldErrors}
                      multiline
                    />
                  </FormSection>
                );
              })}

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full border-dashed"
                disabled={!canWrite}
                onClick={() =>
                  setSections([
                    ...draft.sections,
                    { id: `section-${crypto.randomUUID().slice(0, 8)}`, heading: empty, body: empty },
                  ])
                }
              >
                <Plus /> {t("pages.addSection")}
              </Button>
            </section>

            <FormSection title={t("pages.ctaTitle")} description={t("pages.ctaHint")}>
              <UiField orientation="horizontal" className={`rounded-lg border p-3 ${draft.cta ? "mb-5" : ""}`}>
                <FieldContent>
                  <FieldLabel htmlFor="page-has-cta">{t("pages.hasCta")}</FieldLabel>
                </FieldContent>
                <Switch
                  id="page-has-cta"
                  checked={Boolean(draft.cta)}
                  onCheckedChange={(checked) =>
                    setDraft({ ...draft, cta: checked ? { label: empty, href: "/contact" } : undefined })
                  }
                />
              </UiField>
              {draft.cta ? (
                <>
                  <LocalizedField
                    name="cta.label"
                    label={t("pages.ctaLabel")}
                    value={draft.cta.label}
                    onChange={(label) => setDraft({ ...draft, cta: { ...draft.cta!, label } })}
                    fieldErrors={save.fieldErrors}
                    required
                  />
                  <Field label={t("pages.ctaHref")} hint={t("menus.pathHint")} className="mb-0">
                    {(props) => (
                      <Input
                        {...props}
                        dir="ltr"
                        className="font-mono sm:max-w-sm"
                        value={draft.cta?.href ?? ""}
                        onChange={(event) => setDraft({ ...draft, cta: { ...draft.cta!, href: event.target.value } })}
                      />
                    )}
                  </Field>
                </>
              ) : null}
            </FormSection>
          </div>

          <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-16">
            <FormSection title={t("section.visibility")} description={t("section.visibilityHint")}>
              <UiField orientation="horizontal" className="rounded-lg border p-3">
                <FieldContent>
                  <FieldLabel htmlFor="page-published">{t("pages.published")}</FieldLabel>
                  <FieldDescription>{t("pages.publishedHint")}</FieldDescription>
                </FieldContent>
                <Switch
                  id="page-published"
                  checked={draft.status === "published"}
                  onCheckedChange={(checked) => setDraft({ ...draft, status: checked ? "published" : "draft" })}
                />
              </UiField>
              {/* The saved page, not the draft: the link is only live once publishing has been saved. */}
              {page && page.status === "published" ? (
                <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                  <a href={`${site}/${locale}${menuPagePath(page.slug)}`} target="_blank" rel="noreferrer">
                    <ExternalLink /> {t("menus.viewOnSite")}
                  </a>
                </Button>
              ) : null}
            </FormSection>

            <FormSection title={t("section.organisation")} description={t("section.organisationHint")}>
              <Field
                name="slug"
                label={t("pages.slug")}
                hint={t("pages.slugHint")}
                error={save.fieldErrors?.slug}
                required
                className="mb-0"
              >
                {(props) => (
                  <Input
                    {...props}
                    dir="ltr"
                    className="font-mono text-[0.8rem]"
                    value={draft.slug}
                    onChange={(event) => setDraft({ ...draft, slug: event.target.value.trim().toLowerCase() })}
                  />
                )}
              </Field>
            </FormSection>
          </div>
        </div>

        <FormActions
          start={
            page ? (
              <Button type="button" variant="destructive" disabled={!canWrite} onClick={() => setConfirmingDelete(true)}>
                <Trash2 /> {t("pages.delete")}
              </Button>
            ) : null
          }
        >
          {save.result && page ? (
            <p role="status" className="text-sm font-medium text-foreground">
              {t("state.saved")}
            </p>
          ) : null}
          <Button type="button" variant="outline" onClick={() => navigate("/content/menu")}>
            {t("action.cancel")}
          </Button>
          <Button type="submit" disabled={!canWrite || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {save.isPending ? t("action.saving") : page ? t("pages.save") : t("pages.create")}
          </Button>
        </FormActions>
      </form>

      {/* Removing a section only changes the draft, but it takes its text with it. */}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? t("menus.removeTitle", { name: removing.name }) : ""}
        description={t("pages.removeSectionBody")}
        confirmLabel={t("menus.remove")}
        onConfirm={async () => {
          if (!removing) return;
          setSections(draft.sections.filter((_, i) => i !== removing.index));
        }}
      />

      {page ? (
        <ConfirmDialog
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          title={t("crud.deleteTitle", { name: page.title[locale] || page.title.en })}
          description={t("pages.deleteConfirm")}
          onConfirm={async () => {
            await menusAdminService.deletePage(page.id);
            notice.success(t("crud.deleted", { name: page.title[locale] || page.title.en }));
            navigate("/content/menu");
          }}
        />
      ) : null}
    </>
  );
}

/** Content → Courses menu → a page (`/content/menu/pages/new` creates one). */
export function MenuPageRoute() {
  const { pageId = "new" } = useParams();
  const { t } = useTranslation();
  const isNew = pageId === "new";
  const state = useAsyncData(() => (isNew ? Promise.resolve(null) : menusAdminService.getPage(pageId)), [pageId]);

  return (
    <RequirePermission permission="content:read">
      <BackLink to="/content/menu" />
      <PageHeader title={isNew ? t("pages.newTitle") : t("pages.editTitle")} />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(page) =>
          !isNew && !page ? (
            <StateMessage title={t("state.unavailableTitle")} description={t("state.unavailableBody")} />
          ) : (
            <PageEditor key={page?.updatedAt ?? "new"} page={page} />
          )
        }
      </AsyncBoundary>
    </RequirePermission>
  );
}
