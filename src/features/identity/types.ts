import type { ListQuery } from "@/types";

/**
 * The platform's own identity system — every account (customers, coaches,
 * employers, staff), the roles they hold and what each role may do — as the
 * live API's `Users`, `Roles` and `Permissions` tags expose it.
 *
 * It sits beside, not over, the Staff screen (`features/auth`) and its fixed
 * `ADMIN_ROLES`: those decide what this console offers, these decide what the
 * API allows.
 */

/** The API's gender codes. It publishes no labels for them, so the screens own theirs. */
export const GENDER_IDS = [1, 2] as const;
export type GenderId = (typeof GENDER_IDS)[number];

/** One permission the API knows: `name` is the code, e.g. `Products.Update`. */
export interface AccessPermission {
  readonly id: string;
  readonly name: string;
  readonly resource: string;
  readonly action: string;
}

export interface Role {
  readonly id: string;
  readonly name: string;
}

export interface RoleWithPermissions extends Role {
  readonly permissions: readonly AccessPermission[];
}

/** `cloneFromRoleId` is read on create only: the new role starts with that role's permissions. */
export interface RoleDraft {
  readonly name: string;
  readonly cloneFromRoleId?: string;
}

export interface PlatformUser {
  readonly id: string;
  readonly userName: string;
  readonly email: string;
  readonly phoneNumber?: string;
  readonly fullName: string;
  /** ISO date-time. */
  readonly birthDate?: string;
  readonly isActive: boolean;
  readonly profileImageUrl?: string;
  readonly genderId?: GenderId;
  readonly countryId?: string;
  readonly cityId?: string;
  readonly jobStatusId?: string;
  /** The API has no call that changes a user's role, so it is shown, never edited. */
  readonly roleId?: string;
  readonly roleName?: string;
}

/** What staff may correct on an account. `birthDate` is a calendar date (`yyyy-mm-dd`). */
export interface UserDraft {
  readonly userName: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly fullName: string;
  readonly birthDate?: string;
  readonly genderId?: GenderId;
  readonly countryId?: string;
  readonly cityId?: string;
  readonly jobStatusId?: string;
  readonly isActive: boolean;
}

/** A new account with the platform's plain `User` role, and the password it signs in with. */
export interface NewUserDraft extends Omit<UserDraft, "isActive"> {
  readonly password: string;
}

/** One permission as it applies to one user, from their role or set on them directly. */
export interface UserPermission {
  readonly permissionId: string;
  readonly name: string;
  readonly resource: string;
  readonly action: string;
  readonly isGranted: boolean;
}

/** A direct grant or denial on one user, which wins over what their role says. */
export interface PermissionOverride {
  readonly permissionId: string;
  readonly isGranted: boolean;
}

export interface UserListQuery extends ListQuery {
  readonly isActive?: boolean;
  readonly roleName?: string;
}
