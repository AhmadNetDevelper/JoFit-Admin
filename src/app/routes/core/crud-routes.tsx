import { Outlet, type RouteObject } from "react-router-dom";

import { RequirePermission } from "@/features/auth";

import { screen } from "../../lazy-screen";

/** The core screens added for add / edit / delete. Spread into the admin router. */
export const coreCrudRoutes: RouteObject[] = [
  /* The guard is a pathless parent so it stays in the shell while the screen
     under it loads on demand — someone without the permission never downloads it. */
  {
    element: (
      <RequirePermission permission="settings:write">
        <Outlet />
      </RequirePermission>
    ),
    children: [{ path: "team", ...screen(() => import("./team"), "TeamRoute") }],
  },
];
