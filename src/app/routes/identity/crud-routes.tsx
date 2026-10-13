import { Outlet, type RouteObject } from "react-router-dom";

import { RequirePermission } from "@/features/auth";

import { screen } from "../../lazy-screen";

/** Platform accounts, roles and permissions. Spread into the admin router. */
export const identityRoutes: RouteObject[] = [
  {
    element: (
      <RequirePermission permission="users:write">
        <Outlet />
      </RequirePermission>
    ),
    children: [
      { path: "access/users", ...screen(() => import("./users"), "UsersRoute") },
      { path: "access/users/:userId", ...screen(() => import("./user-detail"), "UserDetailRoute") },
      { path: "access/roles", ...screen(() => import("./roles"), "RolesRoute") },
      { path: "access/roles/:roleId", ...screen(() => import("./role-detail"), "RoleDetailRoute") },
    ],
  },
];
