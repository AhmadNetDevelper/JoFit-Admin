import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { AppError, imageProblem, localize, notFound, nowIso, paginate, storedImage, validationFailed } from "@/lib";
import { pushCatalogueImages } from "@/mocks/bridge";
import { mockArticleCategories, mockArticles, mockAuthors } from "@/mocks/content";
import { localizedValues, matchesAny, matchesText, simulateLatency, sortRows } from "@/mocks/runtime";
import type { ListQuery, LocalizedText, MediaImage } from "@/types";

import type {
  AdminArticle,
  ArticleCategory,
  ArticleCategoryDraft,
  ArticleDraft,
  ArticleSortField,
  Author,
  AuthorDraft,
} from "../types";
import type { ContentAdminService } from "./content.contract";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MESSAGE = "Lower-case letters, numbers and hyphens, e.g. first-10k-plan.";

/**
 * An image on a record, as the API checks it (the shared rules in `@/lib`).
 * `undefined` (left out) keeps what is on file, `null` removes it; anything
 * else must be an uploaded image, and only its own fields are kept, so a body
 * cannot smuggle others in.
 */
function readImage(
  key: string,
  value: unknown,
  errors: Record<string, string>,
): MediaImage | null | undefined {
  if (value === undefined || value === null) return value;
  const problem = imageProblem(value);
  if (problem) {
    errors[key] = problem;
    return undefined;
  }
  return storedImage(value as MediaImage);
}

function requireArticle(id: string): { article: AdminArticle; index: number } {
  const index = mockArticles.findIndex((entry) => entry.id === id);
  const article = mockArticles[index];
  if (!article) throw notFound(`Article "${id}"`);
  return { article, index };
}

function selectSortValue(
  article: AdminArticle,
  field: ArticleSortField,
  locale: Locale,
): unknown {
  switch (field) {
    case "title":
      return localize(article.title, locale);
    case "status":
      return article.status;
    case "publishedAt":
      return article.publishedAt ?? "";
    case "updatedAt":
      return article.audit.updatedAt;
  }
}

/** "1 article is" / "3 articles are", and "it" / "them" — for the sentences that refuse a delete. */
const articlesAre = (count: number) => (count === 1 ? "1 article is" : `${count} articles are`);
const itOrThem = (count: number) => (count === 1 ? "it" : "them");

/** A readable id (`acat-nutrition`); a short random tail only when it is taken. */
function newId(prefix: string, base: string, taken: readonly { readonly id: string }[]): string {
  const random = () => Math.random().toString(36).slice(2, 7);
  const stem = `${prefix}-${base || random()}`;
  return taken.some((row) => row.id === stem) ? `${stem}-${random()}` : stem;
}

/** A name's Latin letters as an id fragment; empty for a name written only in Arabic. */
const idFragment = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");

const trimText = (text: LocalizedText | undefined): LocalizedText => ({
  en: (text?.en ?? "").trim(),
  ar: (text?.ar ?? "").trim(),
});

/** An optional bilingual text: both languages or neither, never half of one. */
function checkOptionalPair(
  key: string,
  text: LocalizedText | undefined,
  errors: Record<string, string>,
): LocalizedText | undefined {
  const value = trimText(text);
  if (!value.en && !value.ar) return undefined;
  if (!value.en) errors[`${key}.en`] = "Fill in both languages, or leave both empty.";
  if (!value.ar) errors[`${key}.ar`] = "Fill in both languages, or leave both empty.";
  return value;
}

/**
 * A draft needs the default language; publishing requires every language. The
 * slug, author, categories and cover are checked on every save, published or
 * not. Answers the cover as `readImage` reads it.
 */
function validateDraft(
  draft: ArticleDraft,
  requireAllLocales: boolean,
  id?: string,
): MediaImage | null | undefined {
  const fieldErrors: Record<string, string> = {};
  const required: readonly Locale[] = requireAllLocales ? LOCALES : [DEFAULT_LOCALE];

  for (const locale of required) {
    if ((draft.title?.[locale] ?? "").trim().length < 3) {
      fieldErrors[`title.${locale}`] = "Title must be at least 3 characters.";
    }
    if ((draft.excerpt?.[locale] ?? "").trim() === "") {
      fieldErrors[`excerpt.${locale}`] = "Excerpt is required.";
    }
  }
  if (!SLUG.test(draft.slug ?? "")) fieldErrors.slug = SLUG_MESSAGE;
  else if (mockArticles.some((article) => article.slug === draft.slug && article.id !== id)) {
    fieldErrors.slug = "Another article already uses this address.";
  }
  if (!mockAuthors.some((author) => author.id === draft.authorId)) fieldErrors.authorId = "Choose an author.";
  const categoryIds = draft.categoryIds ?? [];
  if (categoryIds.length === 0) fieldErrors.categoryIds = "Choose at least one category.";
  else if (categoryIds.some((categoryId) => !mockArticleCategories.some((category) => category.id === categoryId))) {
    fieldErrors.categoryIds = "One of these categories no longer exists.";
  }
  const coverImage = readImage("coverImage", draft.coverImage, fieldErrors);
  if (Object.keys(fieldErrors).length > 0) throw validationFailed(fieldErrors);
  return coverImage;
}

/** Minutes at 200 words a minute, from whichever language runs longer. */
function readingMinutes(body: LocalizedText): number {
  const words = Math.max(...LOCALES.map((locale) => (body[locale] ?? "").split(/\s+/).filter(Boolean).length));
  return Math.max(1, Math.round(words / 200));
}

/** Both names, a well-formed free slug, and a description in both languages or neither. */
function validateCategory(draft: ArticleCategoryDraft, id?: string): ArticleCategoryDraft {
  const errors: Record<string, string> = {};
  const name = trimText(draft.name);
  if (!name.en) errors["name.en"] = "Required.";
  if (!name.ar) errors["name.ar"] = "Required.";
  const slug = (draft.slug ?? "").trim();
  if (!SLUG.test(slug)) errors.slug = "Lower-case letters, numbers and hyphens, e.g. nutrition.";
  else if (mockArticleCategories.some((category) => category.slug === slug && category.id !== id)) {
    errors.slug = "Another category already uses this address.";
  }
  const description = checkOptionalPair("description", draft.description, errors);
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  return { slug, name, ...(description ? { description } : {}) };
}

/**
 * A name; a slug, when given, well formed and free; a role and bio each in
 * both languages or neither; and an avatar that is an uploaded image.
 * `avatar` comes back as `readImage` reads it: undefined keeps the one on file.
 */
function validateAuthor(draft: AuthorDraft, id?: string): AuthorDraft {
  const errors: Record<string, string> = {};
  const name = (draft.name ?? "").trim();
  if (!name) errors.name = "Required.";
  const slug = (draft.slug ?? "").trim();
  if (slug && !SLUG.test(slug)) errors.slug = "Lower-case letters, numbers and hyphens, e.g. nadia-khoury.";
  else if (slug && mockAuthors.some((author) => author.slug === slug && author.id !== id)) {
    errors.slug = "Another author already uses this address.";
  }
  const role = checkOptionalPair("role", draft.role, errors);
  const bio = checkOptionalPair("bio", draft.bio, errors);
  const avatar = readImage("avatar", draft.avatar, errors);
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  return {
    name,
    ...(slug ? { slug } : {}),
    ...(role ? { role } : {}),
    ...(bio ? { bio } : {}),
    ...(avatar !== undefined ? { avatar } : {}),
  };
}

/** A checked draft applied to what is on file: an avatar left out keeps it, `null` removes it. */
function withAvatar(clean: AuthorDraft, current: MediaImage | undefined): Omit<Author, "id"> {
  const { avatar, ...rest } = clean;
  const next = avatar === undefined ? current : (avatar ?? undefined);
  return { ...rest, ...(next ? { avatar: next } : {}) };
}

/**
 * A reference list in the order asked for: by name, in the language it is
 * read in, unless `sortField` is one of `fields`.
 */
function ordered<T>(
  rows: readonly T[],
  query: ListQuery,
  nameOf: (row: T, locale: Locale) => string,
  fields: Readonly<Record<string, (row: T) => unknown>> = {},
): T[] {
  const locale = query.locale ?? DEFAULT_LOCALE;
  const direction = query.sort?.direction ?? "asc";
  const select = query.sort ? fields[query.sort.field] : undefined;
  if (select) return sortRows(rows, select, direction);
  const sorted = [...rows].sort((a, b) =>
    nameOf(a, locale).localeCompare(nameOf(b, locale), locale, { sensitivity: "base", numeric: true }),
  );
  return direction === "desc" ? sorted.reverse() : sorted;
}

const categoryUsage = (id: string) => mockArticles.filter((article) => article.categoryIds.includes(id)).length;
const authorUsage = (id: string) => mockArticles.filter((article) => article.authorId === id).length;

const withCategoryCount = (category: ArticleCategory): ArticleCategory => ({
  ...category,
  articleCount: categoryUsage(category.id),
});
const withAuthorCount = (author: Author): Author => ({ ...author, articleCount: authorUsage(author.id) });

export const mockContentAdminService: ContentAdminService = {
  async listArticles(query = {}) {
    await simulateLatency();
    const filtered = mockArticles.filter((article) => {
      const searchable = [...localizedValues(article.title), ...localizedValues(article.excerpt), article.slug];
      if (!matchesText(searchable, query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(article.status)) return false;
      if (!matchesAny([...article.categoryIds], query.categoryIds)) return false;
      if (query.authorId && article.authorId !== query.authorId) return false;
      return true;
    });
    const locale = query.locale ?? DEFAULT_LOCALE;
    const sorted = query.sort
      ? sortRows(
          filtered,
          (article) => selectSortValue(article, query.sort!.field, locale),
          query.sort.direction,
        )
      : sortRows(filtered, (article) => article.audit.updatedAt, "desc");
    return paginate(sorted, query);
  },

  async getArticle(id) {
    await simulateLatency();
    return mockArticles.find((article) => article.id === id) ?? null;
  },

  async createArticle(draft) {
    await simulateLatency();
    const coverImage = validateDraft(draft, false);
    const at = nowIso();
    const article: AdminArticle = {
      id: newId("article", draft.slug, mockArticles),
      slug: draft.slug,
      title: trimText(draft.title),
      excerpt: trimText(draft.excerpt),
      body: { en: draft.body?.en ?? "", ar: draft.body?.ar ?? "" },
      authorId: draft.authorId,
      categoryIds: [...draft.categoryIds],
      sportIds: [...(draft.sportIds ?? [])],
      ...(coverImage ? { coverImage } : {}),
      seo: draft.seo,
      readingMinutes: readingMinutes(draft.body ?? { en: "", ar: "" }),
      // Publishing is its own decision with its own rule; a new article never skips it.
      status: "draft",
      audit: { createdAt: at, createdBy: "staff", updatedAt: at, updatedBy: "staff" },
    };
    mockArticles.push(article);
    /* Pictures reach the storefront; the rest of the article does not (`pushCatalogueImages`). */
    pushCatalogueImages("article", article.id, ["coverImage"], undefined, article);
    return article;
  },

  async updateArticle(id, draft) {
    await simulateLatency();
    const { article, index } = requireArticle(id);
    const coverImage = validateDraft(draft, article.status === "published", id);
    /* Left out keeps the cover on file; `null` removes it. */
    const { coverImage: current, ...kept } = article;
    const nextCover = coverImage === undefined ? current : (coverImage ?? undefined);
    // Field by field, so a body carrying `status` or `id` cannot slip past the draft.
    const updated: AdminArticle = {
      ...kept,
      ...(nextCover ? { coverImage: nextCover } : {}),
      slug: draft.slug,
      title: draft.title,
      excerpt: draft.excerpt,
      body: draft.body ?? article.body,
      authorId: draft.authorId,
      categoryIds: [...draft.categoryIds],
      sportIds: draft.sportIds ? [...draft.sportIds] : article.sportIds,
      seo: draft.seo,
      audit: { ...article.audit, updatedAt: nowIso(), updatedBy: "admin-4" },
    };
    mockArticles[index] = updated;
    pushCatalogueImages("article", id, ["coverImage"], article, updated);
    return updated;
  },

  async setArticleStatus(id, status) {
    await simulateLatency();
    const { article, index } = requireArticle(id);
    if (status === "published") {
      const untranslated = LOCALES.filter((locale) => (article.body[locale] ?? "").trim() === "");
      if (untranslated.length > 0) {
        throw validationFailed(
          Object.fromEntries(
            untranslated.map((locale) => [
              `body.${locale}`,
              "An article needs a body in every language before it can be published.",
            ]),
          ),
        );
      }
    }
    const updated: AdminArticle = {
      ...article,
      status,
      publishedAt: status === "published" ? (article.publishedAt ?? nowIso()) : article.publishedAt,
      audit: { ...article.audit, updatedAt: nowIso(), updatedBy: "admin-4" },
    };
    mockArticles[index] = updated;
    return updated;
  },

  async deleteArticle(id) {
    await simulateLatency();
    const { index } = requireArticle(id);
    mockArticles.splice(index, 1);
  },

  async listCategories() {
    await simulateLatency();
    return mockArticleCategories.map(withCategoryCount);
  },

  async listCategoriesPage(query) {
    await simulateLatency();
    const rows = mockArticleCategories
      .filter((category) => matchesText([...localizedValues(category.name), category.slug], query.search))
      .map(withCategoryCount);
    const sorted = ordered(rows, query, (category, locale) => localize(category.name, locale), {
      slug: (category) => category.slug,
      articleCount: (category) => category.articleCount ?? 0,
    });
    return paginate(sorted, query);
  },

  async createCategory(draft) {
    await simulateLatency();
    const clean = validateCategory(draft);
    const category: ArticleCategory = { ...clean, id: newId("acat", clean.slug, mockArticleCategories) };
    mockArticleCategories.push(category);
    return withCategoryCount(category);
  },

  async updateCategory(id, draft) {
    await simulateLatency();
    const index = mockArticleCategories.findIndex((category) => category.id === id);
    if (index < 0) throw notFound(`Article category "${id}"`);
    const category: ArticleCategory = { ...validateCategory(draft, id), id };
    mockArticleCategories[index] = category;
    return withCategoryCount(category);
  },

  async deleteCategory(id) {
    await simulateLatency();
    const index = mockArticleCategories.findIndex((category) => category.id === id);
    if (index < 0) throw notFound(`Article category "${id}"`);
    const count = categoryUsage(id);
    if (count > 0) {
      throw new AppError(
        "conflict",
        `${articlesAre(count)} filed under this category. Move ${itOrThem(count)} to another category first.`,
        { status: 409 },
      );
    }
    mockArticleCategories.splice(index, 1);
  },

  async listAuthors() {
    await simulateLatency();
    return mockAuthors.map(withAuthorCount);
  },

  async listAuthorsPage(query) {
    await simulateLatency();
    const rows = mockAuthors
      .filter((author) => matchesText([author.name, author.slug], query.search))
      .map(withAuthorCount);
    const sorted = ordered(rows, query, (author) => author.name, {
      slug: (author) => author.slug ?? "",
      articleCount: (author) => author.articleCount ?? 0,
    });
    return paginate(sorted, query);
  },

  async createAuthor(draft) {
    await simulateLatency();
    const clean = withAvatar(validateAuthor(draft), undefined);
    const author: Author = { ...clean, id: newId("author", clean.slug ?? idFragment(clean.name), mockAuthors) };
    mockAuthors.push(author);
    pushCatalogueImages("author", author.id, ["avatar"], undefined, author);
    return withAuthorCount(author);
  },

  async updateAuthor(id, draft) {
    await simulateLatency();
    const index = mockAuthors.findIndex((author) => author.id === id);
    const current = mockAuthors[index];
    if (!current) throw notFound(`Author "${id}"`);
    const author: Author = { ...withAvatar(validateAuthor(draft, id), current.avatar), id };
    mockAuthors[index] = author;
    pushCatalogueImages("author", id, ["avatar"], current, author);
    return withAuthorCount(author);
  },

  async deleteAuthor(id) {
    await simulateLatency();
    const index = mockAuthors.findIndex((author) => author.id === id);
    if (index < 0) throw notFound(`Author "${id}"`);
    const count = authorUsage(id);
    if (count > 0) {
      throw new AppError(
        "conflict",
        `${articlesAre(count)} credited to this author. Give ${itOrThem(count)} another author first.`,
        { status: 409 },
      );
    }
    mockAuthors.splice(index, 1);
  },
};
