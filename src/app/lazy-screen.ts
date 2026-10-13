import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";

/**
 * A route whose screen is downloaded the first time someone opens it.
 *
 * Every screen used to be in the one bundle a member of staff downloads
 * before the sign-in page appears — 1.7 MB and growing with each domain.
 * With this, the bundle holds the shell (layout, sign-in, the kit) and each
 * screen arrives as its own small file, cached after the first visit. The
 * router keeps the current screen on view while the next one loads, so a
 * navigation never flashes an empty page.
 *
 *   { path: "orders", ...screen(() => import("./routes/orders/orders"), "OrdersRoute") }
 */
export function screen<TModule, TName extends keyof TModule>(
  load: () => Promise<TModule>,
  name: TName,
): Pick<RouteObject, "lazy"> {
  return {
    lazy: async () => ({ Component: (await load())[name] as ComponentType }),
  };
}
