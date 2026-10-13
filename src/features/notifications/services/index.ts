import { resolveService } from "@/services";

import type { NotificationsAdminService } from "./notifications.contract";
import { httpNotificationsAdminService } from "./notifications.http";
import { mockNotificationsAdminService } from "./notifications.mock";

export const notificationsAdminService = resolveService<NotificationsAdminService>("notifications", {
  mock: mockNotificationsAdminService,
  http: httpNotificationsAdminService,
});

export type { NotificationsAdminService } from "./notifications.contract";
