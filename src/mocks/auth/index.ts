import type { AdminUser } from "@/features/auth";

/**
 * Development accounts, one per role, so every permission path can be walked
 * through. There are no passwords because there is nothing to check them
 * against — see `auth.mock.ts`.
 */
/* Mutable: staff are added and removed on the Team screen. */
export const mockAdminUsers: AdminUser[] = [
  { id: "admin-1", name: "Owner Account", email: "superadmin@jofit.com", role: "owner" },
  { id: "admin-2", name: "Store Manager", email: "manager@jofit.test", role: "manager" },
  { id: "admin-3", name: "Catalogue Editor", email: "catalogue@jofit.test", role: "catalogue-editor" },
  { id: "admin-4", name: "Content Editor", email: "content@jofit.test", role: "content-editor" },
  { id: "admin-5", name: "Support Agent", email: "support@jofit.test", role: "support" },
  { id: "admin-6", name: "Read Only", email: "viewer@jofit.test", role: "viewer" },
];
