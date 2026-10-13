import type { AdminArticle, ArticleCategory, Author } from "@/features/content";
import type { AuditInfo } from "@/types";

import { daysFromToday } from "../runtime";
import { storefrontImage } from "../website/assets";
import { websiteSnapshot } from "../website/snapshot";

/**
 * The storefront's articles, plus the draft that is not on it yet.
 *
 * Published articles come from the website snapshot so the blog and the admin
 * list the same three, with the storefront's own cover images (made absolute,
 * so the admin can show them). The winter-kit piece is a draft with no Arabic yet —
 * which is exactly why it is not public: publishing requires every language.
 */
const audit = (createdAt: string, updatedAt: string): AuditInfo => ({
  createdAt,
  createdBy: "admin-4",
  updatedAt,
  updatedBy: "admin-4",
});

export const mockAuthors: Author[] = websiteSnapshot.authors.map((author) => {
  const avatar = storefrontImage(author.avatar);
  return {
    id: author.id,
    slug: author.slug,
    name: author.name,
    ...(author.bio ? { bio: author.bio } : {}),
    ...(avatar ? { avatar } : {}),
  };
});

export const mockArticleCategories: ArticleCategory[] = websiteSnapshot.articleCategories.map(
  (category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
  }),
);

const published: AdminArticle[] = websiteSnapshot.articles.map((article) => ({
  id: article.id,
  ...(article.coverImage ? { coverImage: storefrontImage(article.coverImage) } : {}),
  slug: article.slug,
  title: article.title,
  excerpt: article.excerpt,
  body: article.body,
  authorId: article.authorId,
  categoryIds: article.categoryIds,
  sportIds: article.sportIds,
  readingMinutes: article.readingMinutes,
  status: article.status,
  publishedAt: article.publishedAt,
  audit: audit(article.publishedAt, article.publishedAt),
}));

export const mockArticles: AdminArticle[] = [
  ...published,
  {
    id: "article-winter-kit",
    slug: "winter-training-kit",
    title: { en: "Winter training kit that earns its place", ar: "" },
    excerpt: { en: "Four items worth the money when the temperature drops.", ar: "" },
    body: { en: "", ar: "" },
    authorId: "author-basel",
    categoryIds: ["acat-gear"],
    sportIds: ["sport-running", "sport-cycling"],
    readingMinutes: 4,
    status: "draft",
    audit: audit(daysFromToday(-7), daysFromToday(-7)),
  },
];
