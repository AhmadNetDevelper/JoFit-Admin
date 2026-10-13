import type { SportId } from "@/features/sports";
import type { AuditInfo, ListQuery, LocalizedText, MediaImage, PublishStatus, SeoMeta } from "@/types";

/**
 * Editorial content is kept separate from commerce: an article is never a
 * product, and the content source is a different system from the catalogue.
 * Their only connection is the shared sports taxonomy.
 */
export interface Author {
  readonly id: string;
  /** The storefront's URL-safe handle for them (`nadia-khoury`). Optional. */
  readonly slug?: string;
  /** A person's name — never translated. */
  readonly name: string;
  /** What they do, printed under the byline ("Head running coach"). */
  readonly role?: LocalizedText;
  readonly bio?: LocalizedText;
  /** A square portrait, shown with their name. */
  readonly avatar?: MediaImage;
  /** Articles credited to them. Computed by the list, never stored. */
  readonly articleCount?: number;
}

/**
 * The editable part of an author. On a save, an `avatar` of `null` removes the
 * photo; leaving it out keeps the one on file.
 */
export type AuthorDraft = Omit<Author, "id" | "articleCount" | "avatar"> & {
  readonly avatar?: MediaImage | null;
};

export interface ArticleCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
  /** Articles filed under it. Computed by the list, never stored. */
  readonly articleCount?: number;
}

/** The editable part of an article category. */
export type ArticleCategoryDraft = Omit<ArticleCategory, "id" | "articleCount">;

export interface AdminArticle {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly excerpt: LocalizedText;
  /**
   * Rich text as the source stores it. The editing surface (Markdown textarea,
   * block editor, embedded CMS) is an OPEN DECISION that waits on the CMS
   * choice; only this field's editor changes when it is settled.
   */
  readonly body: LocalizedText;
  readonly authorId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly SportId[];
  /** Live-only today (`AdminArticleDto.tags`) — no editor field reads or writes this yet. */
  readonly tags?: readonly string[];
  /** Live-only today (`AdminArticleDto.relatedArticleIds`) — no editor field reads or writes this yet. */
  readonly relatedArticleIds?: readonly string[];
  readonly coverImage?: MediaImage;
  readonly readingMinutes: number;
  readonly status: PublishStatus;
  readonly publishedAt?: string;
  readonly seo?: SeoMeta;
  readonly audit: AuditInfo;
}

export const ARTICLE_SORT_FIELDS = ["title", "status", "publishedAt", "updatedAt"] as const;
export type ArticleSortField = (typeof ARTICLE_SORT_FIELDS)[number];

export interface ArticleListQuery extends ListQuery<ArticleSortField> {
  readonly statuses?: readonly PublishStatus[];
  readonly categoryIds?: readonly string[];
  readonly authorId?: string;
}

/**
 * The editable subset — never the whole entity. Creating takes the same shape:
 * a new article always starts as a draft, and publishing stays its own command.
 */
export interface ArticleDraft {
  readonly slug: string;
  readonly title: LocalizedText;
  readonly excerpt: LocalizedText;
  readonly body: LocalizedText;
  readonly authorId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly SportId[];
  /**
   * Live-only today — same gap as `AdminArticle.tags`/`relatedArticleIds`: no
   * editor field reads or writes these yet. The live `PUT` replaces the whole
   * article, though, so a save MUST still forward whatever came off the
   * record (via `toDraft`) or it silently wipes them. `undefined` (a new
   * article) sends nothing, which is fine — a draft starts with none anyway.
   */
  readonly tags?: readonly string[];
  readonly relatedArticleIds?: readonly string[];
  /**
   * The article's picture, 16:9. `null` removes it; leaving it out of an update
   * keeps the one on file.
   */
  readonly coverImage?: MediaImage | null;
  readonly seo?: SeoMeta;
}
