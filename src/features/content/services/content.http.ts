import { adminListParams, httpClient, orNull } from "@/services";
import type { AuditInfo, LocalizedText, MediaImage, Paginated, PublishStatus } from "@/types";

import type { AdminArticle, ArticleCategory, ArticleDraft, Author } from "../types";
import type { ContentAdminService } from "./content.contract";

const enc = encodeURIComponent;

/* ------------------------------------------------------------------------
 * Wire DTOs — `docs/api-live/admin.json`, tags AdminArticles /
 * AdminArticleCategories / AdminAuthors. Every id is `int64`, not `string`;
 * `AuditDto` is nested, not the domain's flat `AuditInfo`; and the
 * category/author `articleCount` doesn't line up with the admin's own types
 * at all (the live DTOs have no such field — confirmed, see `toArticleCategory`/
 * `toAuthor`). `tags`/`relatedArticleIds` DO exist on the live write request
 * (`ArticleDraftRequest`) as well as the read DTO — `fromArticleDraft` forwards
 * them when present so a save never wipes them (the live `PUT` replaces the
 * whole row, not a patch). The `to*`/`from*` functions
 * below are this adapter's mapping layer — the job every other `.http.ts`
 * in this repo still owes its domain, done here the way the `.mock.ts`
 * sibling does it for fixture data (its own `to*` helpers), just against the
 * real wire shape instead of an in-memory one.
 * ------------------------------------------------------------------------ */

interface AuditDto {
  readonly createdAt: string;
  readonly createdBy: number | null;
  readonly updatedAt: string | null;
  readonly updatedBy: number | null;
}

interface MediaImageDto {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

interface PagedResultDto<TDto> {
  readonly items: readonly TDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

interface AdminArticleDto {
  readonly id: number;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly excerpt: LocalizedText;
  readonly body: LocalizedText | null;
  readonly status: string;
  readonly authorId: number;
  readonly categoryIds: readonly number[];
  readonly sportIds: readonly number[];
  readonly tags: readonly string[];
  readonly relatedArticleIds: readonly number[];
  readonly readingMinutes: number;
  readonly coverImage: MediaImageDto | null;
  readonly publishedAt: string | null;
  readonly audit: AuditDto;
}

interface ArticleCategoryDto {
  readonly id: number;
  readonly slug: string | null;
  readonly name: LocalizedText;
  readonly description: LocalizedText | null;
}

interface AuthorDto {
  readonly id: number;
  readonly slug: string | null;
  readonly name: string;
  readonly role: LocalizedText | null;
  readonly bio: LocalizedText | null;
  readonly avatar: MediaImageDto | null;
}

function toAudit(dto: AuditDto): AuditInfo {
  return {
    createdAt: dto.createdAt,
    createdBy: dto.createdBy != null ? String(dto.createdBy) : "",
    // `updatedAt` is nullable live (never touched since creation) — fall back to `createdAt`.
    updatedAt: dto.updatedAt ?? dto.createdAt,
    updatedBy: dto.updatedBy != null ? String(dto.updatedBy) : "",
  };
}

function toMediaImage(dto: MediaImageDto): MediaImage {
  return {
    kind: "image",
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    ...(dto.width != null ? { width: dto.width } : {}),
    ...(dto.height != null ? { height: dto.height } : {}),
  };
}

function toPaginated<TDto, TDomain>(page: PagedResultDto<TDto>, mapItem: (item: TDto) => TDomain): Paginated<TDomain> {
  return {
    items: page.items.map(mapItem),
    meta: {
      page: page.page,
      pageSize: page.pageSize,
      totalItems: page.totalCount,
      totalPages: page.totalPages,
      hasNextPage: page.hasNextPage,
      hasPreviousPage: page.hasPreviousPage,
    },
  };
}

function toAdminArticle(dto: AdminArticleDto): AdminArticle {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    body: dto.body ?? { en: "", ar: "" },
    authorId: String(dto.authorId),
    categoryIds: dto.categoryIds.map(String),
    sportIds: dto.sportIds.map(String),
    // Live-only fields `AdminArticle` doesn't have an editor for yet — kept, not dropped.
    tags: dto.tags,
    relatedArticleIds: dto.relatedArticleIds.map(String),
    ...(dto.coverImage ? { coverImage: toMediaImage(dto.coverImage) } : {}),
    readingMinutes: dto.readingMinutes,
    status: dto.status as PublishStatus,
    ...(dto.publishedAt ? { publishedAt: dto.publishedAt } : {}),
    audit: toAudit(dto.audit),
  };
}

function toArticleCategory(dto: ArticleCategoryDto): ArticleCategory {
  return {
    id: String(dto.id),
    // Live `slug` is nullable; the admin type wants a plain string, so empty is the fallback.
    slug: dto.slug ?? "",
    name: dto.name,
    ...(dto.description ? { description: dto.description } : {}),
    // Live has no `articleCount` on this DTO at all (confirmed on both the single and paged shapes) — 0 until the backend adds it.
    articleCount: 0,
  };
}

function toAuthor(dto: AuthorDto): Author {
  return {
    id: String(dto.id),
    ...(dto.slug ? { slug: dto.slug } : {}),
    name: dto.name,
    ...(dto.role ? { role: dto.role } : {}),
    ...(dto.bio ? { bio: dto.bio } : {}),
    ...(dto.avatar ? { avatar: toMediaImage(dto.avatar) } : {}),
    // Same live gap as categories: no `articleCount` on the wire.
    articleCount: 0,
  };
}

/** `ArticleDraft`'s ids are strings; the live `ArticleDraftRequest` wants `int64`. */
function fromArticleDraft(draft: ArticleDraft) {
  return {
    slug: draft.slug,
    title: draft.title,
    excerpt: draft.excerpt,
    body: draft.body,
    authorId: Number(draft.authorId),
    categoryIds: draft.categoryIds.map(Number),
    sportIds: draft.sportIds.map(Number),
    // Forwarded only when the caller set them (`toDraft` carries the loaded
    // article's own values through) — confirmed live on `ArticleDraftRequest`;
    // omitting them on an update would silently clear them, since this is a
    // full replace, not a patch.
    ...(draft.tags !== undefined ? { tags: draft.tags } : {}),
    ...(draft.relatedArticleIds !== undefined ? { relatedArticleIds: draft.relatedArticleIds.map(Number) } : {}),
    ...(draft.coverImage !== undefined ? { coverImage: draft.coverImage } : {}),
    // No `seo` field exists on the live request at all (nor does `AdminArticleDto` return one) —
    // nothing to send; `ArticleDraft.seo` has no backing support on this API today.
  };
}

/**
 * Editorial content over `/v1/admin/articles`, `/v1/admin/article-categories`
 * and `/v1/admin/authors`. Publishing needs every language filled in (422
 * otherwise); deleting a category or author still in use answers 409.
 *
 * The tables read one page (`Paginated`); the article editor's pickers read
 * the whole, short list from `…/options`.
 */
export const httpContentAdminService: ContentAdminService = {
  listArticles: (query = {}) =>
    httpClient
      .get<PagedResultDto<AdminArticleDto>>("/v1/admin/articles", {
        query: {
          ...adminListParams(query),
          statuses: query.statuses,
          categoryIds: query.categoryIds,
          // Live param is `AuthorIds` (plural, array) — a bare `authorId` never bound.
          authorIds: query.authorId ? [query.authorId] : undefined,
        },
        auth: true,
      })
      .then((page) => toPaginated(page, toAdminArticle)),
  getArticle: async (id) => {
    const dto = await orNull(httpClient.get<AdminArticleDto>(`/v1/admin/articles/${enc(id)}`, { auth: true }));
    return dto ? toAdminArticle(dto) : null;
  },
  createArticle: async (draft) =>
    toAdminArticle(
      await httpClient.post<AdminArticleDto>("/v1/admin/articles", fromArticleDraft(draft), { auth: true }),
    ),
  updateArticle: async (id, draft) =>
    toAdminArticle(
      await httpClient.put<AdminArticleDto>(`/v1/admin/articles/${enc(id)}`, fromArticleDraft(draft), { auth: true }),
    ),
  setArticleStatus: async (id, status) =>
    toAdminArticle(
      await httpClient.put<AdminArticleDto>(`/v1/admin/articles/${enc(id)}/status`, { status }, { auth: true }),
    ),
  deleteArticle: async (id) => {
    await httpClient.delete<void>(`/v1/admin/articles/${enc(id)}`, { auth: true });
  },

  listCategories: async () => {
    const dtos = await httpClient.get<ArticleCategoryDto[]>("/v1/admin/article-categories/options", { auth: true });
    return dtos.map(toArticleCategory);
  },
  listCategoriesPage: (query) =>
    httpClient
      .get<PagedResultDto<ArticleCategoryDto>>("/v1/admin/article-categories", {
        query: adminListParams(query),
        auth: true,
      })
      .then((page) => toPaginated(page, toArticleCategory)),
  createCategory: async (draft) =>
    toArticleCategory(
      await httpClient.post<ArticleCategoryDto>("/v1/admin/article-categories", draft, { auth: true }),
    ),
  updateCategory: async (id, draft) =>
    toArticleCategory(
      await httpClient.put<ArticleCategoryDto>(`/v1/admin/article-categories/${enc(id)}`, draft, { auth: true }),
    ),
  deleteCategory: async (id) => {
    await httpClient.delete<void>(`/v1/admin/article-categories/${enc(id)}`, { auth: true });
  },

  listAuthors: async () => {
    const dtos = await httpClient.get<AuthorDto[]>("/v1/admin/authors/options", { auth: true });
    return dtos.map(toAuthor);
  },
  listAuthorsPage: (query) =>
    httpClient
      .get<PagedResultDto<AuthorDto>>("/v1/admin/authors", { query: adminListParams(query), auth: true })
      .then((page) => toPaginated(page, toAuthor)),
  createAuthor: async (draft) => toAuthor(await httpClient.post<AuthorDto>("/v1/admin/authors", draft, { auth: true })),
  updateAuthor: async (id, draft) =>
    toAuthor(await httpClient.put<AuthorDto>(`/v1/admin/authors/${enc(id)}`, draft, { auth: true })),
  deleteAuthor: async (id) => {
    await httpClient.delete<void>(`/v1/admin/authors/${enc(id)}`, { auth: true });
  },
};
