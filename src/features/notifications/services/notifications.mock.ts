import { pushToStorefront } from "@/mocks/bridge";
import { mockStaffNotifications } from "@/mocks/notifications";
import { simulateLatency } from "@/mocks/runtime";

import type { NotificationsAdminService } from "./notifications.contract";

export const mockNotificationsAdminService: NotificationsAdminService = {
  async list() {
    await simulateLatency();
    const sorted = [...mockStaffNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: sorted.slice(0, 50), unreadCount: sorted.filter((entry) => !entry.isRead).length };
  },

  async markRead(ids) {
    await simulateLatency();
    mockStaffNotifications.forEach((entry, index) => {
      if (entry.isRead || (ids && !ids.includes(entry.id))) return;
      mockStaffNotifications[index] = { ...entry, isRead: true };
      pushToStorefront("notification", entry.id, { isRead: true });
    });
  },
};
