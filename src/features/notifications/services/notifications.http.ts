import { httpClient } from "@/services";
import type { LocalizedText } from "@/types";

import type { StaffNotification, StaffNotificationKind } from "../types";
import type { NotificationsAdminService } from "./notifications.contract";

/**
 * Wire DTOs — `docs/api-live/admin.json`, tag AdminNotifications.
 * `StaffNotificationFeedDto` already matches the domain's `{items,
 * unreadCount}` shape; only each item needs mapping (`int64` id, and
 * `isRead: boolean` where the admin type once expected a `readAt` string —
 * see `StaffNotification`'s own comment for why that's now `isRead` too).
 */
interface StaffNotificationItemDto {
  readonly id: number;
  readonly kind: string;
  readonly title: LocalizedText;
  readonly body: LocalizedText;
  readonly href: string;
  readonly createdAt: string;
  readonly isRead: boolean;
}

interface StaffNotificationFeedDto {
  readonly items: readonly StaffNotificationItemDto[];
  readonly unreadCount: number;
}

function toStaffNotification(dto: StaffNotificationItemDto): StaffNotification {
  return {
    id: String(dto.id),
    kind: dto.kind as StaffNotificationKind,
    title: dto.title,
    body: dto.body,
    href: dto.href,
    createdAt: dto.createdAt,
    isRead: dto.isRead,
  };
}

/** The staff team's bell over `/v1/admin/notifications`. */
export const httpNotificationsAdminService: NotificationsAdminService = {
  list: async () => {
    const dto = await httpClient.get<StaffNotificationFeedDto>("/v1/admin/notifications", { auth: true });
    return { items: dto.items.map(toStaffNotification), unreadCount: dto.unreadCount };
  },
  markRead: async (ids) => {
    // Live `MarkReadRequest.ids` is `int64[]`; the admin's ids are numeric strings (see `toStaffNotification`) —
    // sent unquoted so strict server-side JSON deserialization doesn't reject them.
    await httpClient.post<void>("/v1/admin/notifications/read", ids ? { ids: ids.map(Number) } : {}, { auth: true });
  },
};
