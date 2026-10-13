import type { Paginated } from "@/types";

import type {
  AccessPermission,
  NewUserDraft,
  PermissionOverride,
  PlatformUser,
  Role,
  RoleDraft,
  RoleWithPermissions,
  UserDraft,
  UserListQuery,
  UserPermission,
} from "../types";

export interface IdentityService {
  /** Every permission the API knows (`GET /v1/permissions`). */
  listPermissions(): Promise<readonly AccessPermission[]>;

  /** Every role (`GET /v1/roles`) — the list is short and not paged. */
  listRoles(): Promise<readonly Role[]>;
  /** 409 when the name is taken. */
  createRole(draft: RoleDraft): Promise<Role>;
  /** Renames only; permissions are saved with `setRolePermissions`. */
  renameRole(id: string, name: string): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  /** `null` when the role does not exist. */
  getRole(id: string): Promise<RoleWithPermissions | null>;
  /** Replaces the role's permissions with exactly this set. */
  setRolePermissions(id: string, permissionIds: readonly string[]): Promise<RoleWithPermissions>;

  listUsers(query?: UserListQuery): Promise<Paginated<PlatformUser>>;
  getUser(id: string): Promise<PlatformUser | null>;
  /** A plain `User`-role account (`POST /v1/users/normal-user`). */
  createUser(draft: NewUserDraft): Promise<PlatformUser>;
  updateUser(id: string, draft: UserDraft): Promise<PlatformUser>;
  deleteUser(id: string): Promise<void>;
  /** What the user's role grants them. */
  listRolePermissionsOfUser(id: string): Promise<readonly UserPermission[]>;
  /** Grants and denials set on the user directly. */
  listDirectPermissions(id: string): Promise<readonly UserPermission[]>;
  /** Replaces the user's direct grants and denials with exactly this list. */
  setDirectPermissions(id: string, overrides: readonly PermissionOverride[]): Promise<readonly UserPermission[]>;
}
