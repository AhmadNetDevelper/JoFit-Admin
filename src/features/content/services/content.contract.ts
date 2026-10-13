import type { ListQuery, Paginated, PublishStatus } from "@/types";

import type {
  AdminArticle,
  ArticleCategory,
  ArticleCategoryDraft,
  ArticleDraft,
  ArticleListQuery,
  Author,
  AuthorDraft,
} from "../types";

export interface ContentAdminService {
  listArticles(query?: ArticleListQuery): Promise<Paginated<AdminArticle>>;
  getArticle(id: string): Promise<AdminArticle | null>;
  /**
   * Always a draft; 422 when the English title, excerpt, slug, author or
   * category is missing, or the cover image is malformed (`coverImage`).
   */
  createArticle(draft: ArticleDraft): Promise<AdminArticle>;
  updateArticle(id: string, draft: ArticleDraft): Promise<AdminArticle>;
  setArticleStatus(id: string, status: PublishStatus): Promise<AdminArticle>;
  deleteArticle(id: string): Promise<void>;

  /** Every category, each with its `articleCount` — for the article editor's picker. */
  listCategories(): Promise<readonly ArticleCategory[]>;
  /** One page for the categories table; `search` matches either name or the slug. */
  listCategoriesPage(query: ListQuery): Promise<Paginated<ArticleCategory>>;
  /** 422 with field errors when a name is missing or the slug is malformed or taken. */
  createCategory(draft: ArticleCategoryDraft): Promise<ArticleCategory>;
  updateCategory(id: string, draft: ArticleCategoryDraft): Promise<ArticleCategory>;
  /** 409 while any article is filed under it. */
  deleteCategory(id: string): Promise<void>;

  /** Every author, each with its `articleCount` — for the article editor's picker. */
  listAuthors(): Promise<readonly Author[]>;
  /** One page for the authors table; `search` matches the name or the slug. */
  listAuthorsPage(query: ListQuery): Promise<Paginated<Author>>;
  /** 422 with field errors when the name is missing, the slug is malformed or taken, or the avatar is malformed. */
  createAuthor(draft: AuthorDraft): Promise<Author>;
  updateAuthor(id: string, draft: AuthorDraft): Promise<Author>;
  /** 409 while any article is credited to them. */
  deleteAuthor(id: string): Promise<void>;
}
