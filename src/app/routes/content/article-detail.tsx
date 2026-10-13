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
  ImageField,
  LocalizedField,
  UnsavedDialog,
} from "@/components/form";
import {
  Button,
  Input,
  NativeSelect,
  NativeSelectOption,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  contentAdminService,
  type AdminArticle,
  type ArticleCategory,
  type ArticleDraft,
  type Author,
} from "@/features/content";
import { useAsyncAction, useAsyncData, useUnsavedGuard } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { PublishStatus } from "@/types";

import { BackLink } from "../../components/record-parts";

const EMPTY_TEXT = { en: "", ar: "" };

/** A new article: nothing written yet, and — like every new article — a draft. */
const BLANK: ArticleDraft = {
  slug: "",
  title: EMPTY_TEXT,
  excerpt: EMPTY_TEXT,
  body: EMPTY_TEXT,
  authorId: "",
  categoryIds: [],
  sportIds: [],
};

function toDraft(article: AdminArticle): ArticleDraft {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    authorId: article.authorId,
    categoryIds: article.categoryIds,
    sportIds: article.sportIds,
    // No editor field for either yet — carried through unmodified so saving
    // the form (title, author, a status change, …) never wipes them; the
    // live PUT replaces the whole article. See `ArticleDraft`'s doc comment.
    tags: article.tags,
    relatedArticleIds: article.relatedArticleIds,
    coverImage: article.coverImage,
    seo: article.seo,
  };
}

/* The English title suggests the address of a new article until someone types their own. */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

function ArticleEditor({
  article,
  categories,
  authors,
  onSaved,
}: {
  /** `null` while creating. */
  article: AdminArticle | null;
  categories: readonly ArticleCategory[];
  authors: readonly Author[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { text, dateTime } = useFormatters();
  const navigate = useNavigate();
  const notice = useNotice();
  const canWrite = usePermission("content:write");
  const noun = t("articles.noun");
  // Seeded once; the parent remounts on save with a `key`. See product-detail.
  const [draft, setDraft] = useState<ArticleDraft>(() => (article ? toDraft(article) : BLANK));
  const [baseline] = useState<ArticleDraft>(() => (article ? toDraft(article) : BLANK));
  const [slugTouched, setSlugTouched] = useState(article !== null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  /* One form, two commands: a new article is created and opened at its own
     address (replacing `/new` in history, so Back does not reopen a blank
     form); an existing one is saved in place. */
  /* A removed cover is sent as `null`: left out, the API keeps the one on file. */
  const save = useAsyncAction(
    (input: ArticleDraft) => {
      const body: ArticleDraft = { ...input, coverImage: input.coverImage ?? null };
      return article ? contentAdminService.updateArticle(article.id, body) : contentAdminService.createArticle(body);
    },
    {
      onSuccess: (saved) => {
        if (article) {
          notice.success(t("crud.updated"));
          onSaved();
        } else {
          notice.success(t("crud.created", { noun }));
          navigate(`/content/articles/${saved.id}`, { replace: true });
        }
      },
    },
  );

  /*
   * The draft lives in component state, so leaving the screen discards it.
   * Comparing against the record as loaded means the guard turns itself off
   * again when someone undoes their own edit — a dirty flag that only ever goes
   * one way trains people to click through it. It also stands down while a
   * delete is being confirmed, or the navigation after the delete blocks itself.
   */
  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const blocker = useUnsavedGuard(isDirty && !save.isPending && !confirmingDelete);

  /**
   * Publishing is a separate command from saving, because it is a separate
   * decision with its own rule: an article must exist in every language before
   * it can go live.
   */
  const setStatus = useAsyncAction(
    (status: PublishStatus) => contentAdminService.setArticleStatus(article?.id ?? "", status),
    { onSuccess: onSaved },
  );

  /* Shared by both error summaries: a refused publish names the body boxes, too. */
  const labels = {
    "title.en": `${t("field.title")} — EN`,
    "title.ar": `${t("field.title")} — AR`,
    "excerpt.en": `${t("field.summary")} — EN`,
    "excerpt.ar": `${t("field.summary")} — AR`,
    "body.en": `${t("field.description")} — EN`,
    "body.ar": `${t("field.description")} — AR`,
    slug: t("field.slug"),
    authorId: t("field.author"),
    categoryIds: t("field.categories"),
    coverImage: t("articles.cover"),
  };

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
        <FormError error={save.error} labels={labels} />

        {/* What readers read on the main side; how it is filed and whether it is
            live on the side — the two things editors change at different moments. */}
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <FormSection title={t("section.content")} description={t("section.contentHint")}>
              <LocalizedField
                name="title"
                label={t("field.title")}
                value={draft.title}
                onChange={(title) =>
                  setDraft({ ...draft, title, ...(slugTouched ? {} : { slug: slugify(title.en) }) })
                }
                fieldErrors={save.fieldErrors}
                required
              />
              <LocalizedField
                name="excerpt"
                label={t("field.excerpt")}
                value={draft.excerpt}
                onChange={(excerpt) => setDraft({ ...draft, excerpt })}
                fieldErrors={save.fieldErrors}
                required
              />
              {/* Where a reader meets it: under the title and standfirst, above the body. */}
              <ImageField
                name="coverImage"
                label={t("articles.cover")}
                hint={t("articles.coverHint")}
                purpose="article-cover"
                aspect="video"
                className="max-w-xl"
                value={draft.coverImage ?? undefined}
                onChange={(coverImage) => setDraft({ ...draft, coverImage })}
                error={save.fieldErrors?.coverImage}
                disabled={!canWrite}
              />
              <LocalizedField
                name="body"
                label={t("field.body")}
                value={draft.body}
                onChange={(body) => setDraft({ ...draft, body })}
                fieldErrors={save.fieldErrors}
                multiline
              />
            </FormSection>
          </div>

          <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-16">
            <FormSection title={t("section.visibility")} description={t("section.visibilityHint")}>
              {article ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span id="publish-heading" className="text-muted-foreground">
                      {t("field.status")}
                    </span>
                    <StatusBadge status={article.status} />
                  </div>
                  {/* Buttons, not a picker: each is its own command, run straight away,
                      and "publish" can be refused for a missing translation. */}
                  <div role="group" aria-labelledby="publish-heading" className="flex flex-wrap gap-2">
                    {article.status !== "published" ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canWrite || setStatus.isPending}
                        onClick={() => void setStatus.run("published")}
                      >
                        {t("action.publish")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!canWrite || setStatus.isPending}
                        onClick={() => void setStatus.run("draft")}
                      >
                        {t("action.unpublish")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={!canWrite || setStatus.isPending || article.status === "archived"}
                      onClick={() => void setStatus.run("archived")}
                    >
                      {t("action.archive")}
                    </Button>
                    {setStatus.isPending ? (
                      <Loader2 className="size-4 animate-spin self-center text-muted-foreground" aria-hidden="true" />
                    ) : null}
                  </div>
                  <FormError error={setStatus.error} labels={labels} />
                  <p className="text-xs text-muted-foreground">
                    {`${t("field.updated")}: ${dateTime(article.audit.updatedAt)}`}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("articles.startsAsDraft")}</p>
              )}
            </FormSection>

            <FormSection title={t("section.organisation")} description={t("section.organisationHint")}>
              <Field name="slug" label={t("field.slug")} hint={t("field.slugHint")} error={save.fieldErrors?.slug} required>
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
              <Field name="authorId" label={t("field.author")} error={save.fieldErrors?.authorId} required>
                {(props) => (
                  <NativeSelect
                    {...props}
                    value={draft.authorId}
                    onChange={(event) => setDraft({ ...draft, authorId: event.target.value })}
                  >
                    <NativeSelectOption value="" disabled>
                      {t("articles.chooseAuthor")}
                    </NativeSelectOption>
                    {/* A person's name: shown as written, in either language. */}
                    {authors.map((author) => (
                      <NativeSelectOption key={author.id} value={author.id}>
                        {author.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <CheckboxGroupField
                name="categoryIds"
                legend={t("field.categories")}
                hint={t("articles.categoriesHint")}
                required
                columns={2}
                error={save.fieldErrors?.categoryIds}
                options={categories.map((category) => ({ value: category.id, label: text(category.name) }))}
                value={draft.categoryIds}
                onChange={(categoryIds) => setDraft({ ...draft, categoryIds })}
              />
            </FormSection>
          </div>
        </div>

        <FormActions
          start={
            article ? (
              <Button type="button" variant="destructive" disabled={!canWrite} onClick={() => setConfirmingDelete(true)}>
                <Trash2 /> {t("crud.delete")}
              </Button>
            ) : null
          }
        >
          <Button type="button" variant="outline" onClick={() => navigate("/content/articles")}>
            {t("action.cancel")}
          </Button>
          <Button type="submit" disabled={!canWrite || save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {save.isPending ? t("action.saving") : article ? t("action.save") : t("crud.create")}
          </Button>
        </FormActions>
      </form>

      {article ? (
        <ConfirmDialog
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          title={t("crud.deleteTitle", { name: text(article.title) })}
          onConfirm={async () => {
            await contentAdminService.deleteArticle(article.id);
            notice.success(t("crud.deleted", { name: text(article.title) }));
            navigate("/content/articles");
          }}
        />
      ) : null}
    </>
  );
}

/** Content → Articles → an article (`/content/articles/new` creates one). */
export function ArticleDetailRoute() {
  const { articleId = "new" } = useParams();
  const { t } = useTranslation();
  const isNew = articleId === "new";
  /* The pickers need the categories and authors whichever way the form is opened. */
  const state = useAsyncData(async () => {
    const [article, categories, authors] = await Promise.all([
      isNew ? Promise.resolve(null) : contentAdminService.getArticle(articleId),
      contentAdminService.listCategories(),
      contentAdminService.listAuthors(),
    ]);
    return { article, categories, authors };
  }, [articleId]);

  return (
    <RequirePermission permission="content:read">
      <BackLink to="/content/articles" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {({ article, categories, authors }) =>
          isNew || article ? (
            <>
              <PageHeader
                title={article ? t("articles.editTitle") : t("crud.newNoun", { noun: t("articles.noun") })}
                actions={<StatusBadge status={article?.status ?? "draft"} />}
              />
              <ArticleEditor
                key={article?.audit.updatedAt ?? "new"}
                article={article}
                categories={categories}
                authors={authors}
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
