import type { Permission } from "@/types";

export const ADMIN_ROLES = [
  "owner",
  "manager",
  "catalogue-editor",
  "content-editor",
  "support",
  "viewer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: AdminRole;
}

/** The editable part of a staff account. */
export type StaffDraft = Omit<AdminUser, "id">;

/** A staff account as `createStaff` answers it. */
export interface CreatedStaff extends AdminUser {
  /**
   * The password the API generated for the new account, returned this once
   * and never again — whoever added the account must pass it on. `null` when
   * none was generated.
   */
  readonly temporaryPassword: string | null;
}

export interface AdminSession {
  readonly user: AdminUser;
  readonly permissions: readonly Permission[];
}

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}
