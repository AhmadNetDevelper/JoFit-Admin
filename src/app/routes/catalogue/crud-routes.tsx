import type { RouteObject } from "react-router-dom";

import { screen } from "../../lazy-screen";

/** The catalogue screens added for add / edit / delete. Spread into the admin router. */
export const catalogueCrudRoutes: RouteObject[] = [
  /* The edit screen with an empty draft. A static segment outranks the
     `catalogue/products/:productId` route, so "new" is never read as an id. */
  { path: "catalogue/products/new", ...screen(() => import("./product-detail"), "ProductDetailRoute") },
];
