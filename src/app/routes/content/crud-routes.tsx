import type { RouteObject } from "react-router-dom";

import { screen } from "../../lazy-screen";

/** The content screens added for add / edit / delete. Spread into the admin router. */
export const contentCrudRoutes: RouteObject[] = [
  /* Static, so it wins over `content/articles/:articleId` in router.tsx. */
  { path: "content/articles/new", ...screen(() => import("./article-detail"), "ArticleDetailRoute") },
  { path: "content/categories", ...screen(() => import("./article-categories"), "ArticleCategoriesRoute") },
  { path: "content/authors", ...screen(() => import("./authors"), "AuthorsRoute") },
];
