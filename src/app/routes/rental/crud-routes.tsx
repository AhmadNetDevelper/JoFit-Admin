import type { RouteObject } from "react-router-dom";

import { screen } from "../../lazy-screen";

/** The rental screens added for add / edit / delete. Spread into the admin router. */
export const rentalCrudRoutes: RouteObject[] = [
  /* One screen for both; `new` is matched before `:itemId`, and the screen
     reads a missing id as "new". */
  { path: "rental/items/new", ...screen(() => import("./rental-item-detail"), "RentalItemDetailRoute") },
  { path: "rental/items/:itemId", ...screen(() => import("./rental-item-detail"), "RentalItemDetailRoute") },
];
