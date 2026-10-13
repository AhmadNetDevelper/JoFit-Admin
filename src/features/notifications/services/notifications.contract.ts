import type { StaffNotificationFeed } from "../types";

export interface NotificationsAdminService {
  list(): Promise<StaffNotificationFeed>;
  /** Marks these read, or every one when `ids` is omitted. */
  markRead(ids?: readonly string[]): Promise<void>;
}
