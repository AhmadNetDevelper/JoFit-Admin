import { resolveService } from "@/services";

import type { MenusAdminService } from "./menus.contract";
import { httpMenusAdminService } from "./menus.http";
import { mockMenusAdminService } from "./menus.mock";

export const menusAdminService = resolveService<MenusAdminService>("menus", {
  mock: mockMenusAdminService,
  http: httpMenusAdminService,
});

export type { MenusAdminService } from "./menus.contract";
