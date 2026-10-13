import { httpClient, orNull } from "@/services";
import type { PageMeta, Paginated } from "@/types";

import type {
  AccessPermission,
  GenderId,
  NewUserDraft,
  PlatformUser,
  Role,
  RoleWithPermissions,
  UserDraft,
  UserPermission,
} from "../types";
import type { IdentityService } from "./identity.contract";

const enc = encodeURIComponent;
const auth = { auth: true } as const;

/*
 * `/v1/users`, `/v1/roles` and `/v1/permissions` sit at the API root, not
 * under `/v1/admin`. Ids are int64 on the wire and strings here; every JSON
 * body converts them back to numbers, which System.Text.Json requires.
 */

interface PermissionDto {
  readonly id: number;
  readonly name: string;
  readonly resource: string;
  readonly action: string;
}

interface RoleDto {
  readonly roleId: number;
  readonly name: string;
}

interface RolePermissionDto extends RoleDto {
  readonly permissions: readonly PermissionDto[];
}

interface UserDto {
  readonly userId: number;
  readonly userName: string;
  readonly email: string;
  readonly phoneNumber?: string | null;
  readonly fullName: string;
  readonly birthOfDate?: string | null;
  readonly isActive: boolean;
  readonly profileImageUrl?: string | null;
  readonly genderId?: number | null;
  readonly countryId?: number | null;
  readonly cityId?: number | null;
  readonly jobStatusId?: number | null;
  readonly roleId?: number | null;
  readonly roleName?: string | null;
}

interface UserPageDto {
  readonly items: readonly UserDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
  readonly hasPreviousPage?: boolean;
  readonly hasNextPage?: boolean;
  readonly meta?: PageMeta;
}

interface UserPermissionDto {
  readonly userId: number;
  readonly permissionId: number;
  readonly permissionName: string;
  readonly resource: string;
  readonly action: string;
  readonly isGranted: boolean;
}

const optionalId = (value?: number | null) => (value == null ? undefined : String(value));
const toNumber = (id?: string) => (id ? Number(id) : null);

function toPermission(dto: PermissionDto): AccessPermission {
  return { id: String(dto.id), name: dto.name, resource: dto.resource, action: dto.action };
}

function toRole(dto: RoleDto): Role {
  return { id: String(dto.roleId), name: dto.name };
}

function toRoleWithPermissions(dto: RolePermissionDto): RoleWithPermissions {
  return { ...toRole(dto), permissions: dto.permissions.map(toPermission) };
}

function toGender(value?: number | null): GenderId | undefined {
  return value === 1 || value === 2 ? value : undefined;
}

function toUser(dto: UserDto): PlatformUser {
  return {
    id: String(dto.userId),
    userName: dto.userName,
    email: dto.email,
    fullName: dto.fullName,
    isActive: dto.isActive,
    ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
    ...(dto.birthOfDate ? { birthDate: dto.birthOfDate } : {}),
    ...(dto.profileImageUrl ? { profileImageUrl: dto.profileImageUrl } : {}),
    ...(toGender(dto.genderId) ? { genderId: toGender(dto.genderId) } : {}),
    ...(dto.countryId != null ? { countryId: optionalId(dto.countryId) } : {}),
    ...(dto.cityId != null ? { cityId: optionalId(dto.cityId) } : {}),
    ...(dto.jobStatusId != null ? { jobStatusId: optionalId(dto.jobStatusId) } : {}),
    ...(dto.roleId != null ? { roleId: optionalId(dto.roleId) } : {}),
    ...(dto.roleName ? { roleName: dto.roleName } : {}),
  };
}

function toUserPage(dto: UserPageDto): Paginated<PlatformUser> {
  const totalPages = dto.totalPages ?? Math.max(1, Math.ceil(dto.totalCount / Math.max(1, dto.pageSize)));
  return {
    items: dto.items.map(toUser),
    meta: dto.meta ?? {
      page: dto.page,
      pageSize: dto.pageSize,
      totalItems: dto.totalCount,
      totalPages,
      hasNextPage: dto.hasNextPage ?? dto.page < totalPages,
      hasPreviousPage: dto.hasPreviousPage ?? dto.page > 1,
    },
  };
}

function toUserPermission(dto: UserPermissionDto): UserPermission {
  return {
    permissionId: String(dto.permissionId),
    name: dto.permissionName,
    resource: dto.resource,
    action: dto.action,
    isGranted: dto.isGranted,
  };
}

/**
 * A calendar date from the form, as the date-time the API stores.
 *
 * Real bug fixed: the live `PUT /v1/users/{id}` and `POST /v1/users/normal-user`
 * both throw a 500 `DbUpdateException` whenever `birthOfDate`/`BirthOfDate`
 * carries a literal UTC "Z" suffix (confirmed by curl against the running API —
 * `...T00:00:00Z` always 500s; the same instant without "Z" always 200s). The
 * column is evidently a timestamp-without-time-zone, which Npgsql refuses to
 * receive a `DateTime`/`DateTimeOffset` of Kind=Utc for. No offset at all.
 */
const toDateTime = (date?: string) => (date ? `${date}T00:00:00` : null);

function userBody(draft: UserDraft): Record<string, unknown> {
  return {
    userName: draft.userName,
    email: draft.email,
    phoneNumber: draft.phoneNumber,
    fullName: draft.fullName,
    birthOfDate: toDateTime(draft.birthDate),
    genderId: draft.genderId ?? null,
    countryId: toNumber(draft.countryId),
    cityId: toNumber(draft.cityId),
    jobStatusId: toNumber(draft.jobStatusId),
    isActive: draft.isActive,
  };
}

/** `POST /users/normal-user` is multipart only, with flat field names. */
function newUserForm(draft: NewUserDraft): FormData {
  const form = new FormData();
  form.append("UserName", draft.userName);
  form.append("Email", draft.email);
  form.append("Password", draft.password);
  form.append("PhoneNumber", draft.phoneNumber);
  form.append("FullName", draft.fullName);
  /* No "Z" here either — see `toDateTime`'s doc comment above: the live API 500s on it. */
  if (draft.birthDate) form.append("BirthOfDate", `${draft.birthDate}T00:00:00`);
  if (draft.genderId) form.append("GenderId", String(draft.genderId));
  if (draft.countryId) form.append("CountryId", draft.countryId);
  if (draft.cityId) form.append("CityId", draft.cityId);
  if (draft.jobStatusId) form.append("JobStatusId", draft.jobStatusId);
  return form;
}

export const httpIdentityService: IdentityService = {
  listPermissions: async () => (await httpClient.get<readonly PermissionDto[]>("/v1/permissions", auth)).map(toPermission),

  listRoles: async () => (await httpClient.get<readonly RoleDto[]>("/v1/roles", auth)).map(toRole),

  createRole: async (draft) =>
    toRole(
      await httpClient.post<RoleDto>(
        "/v1/roles",
        { name: draft.name, cloneFromRoleId: toNumber(draft.cloneFromRoleId) },
        auth,
      ),
    ),

  renameRole: async (id, name) => toRole(await httpClient.put<RoleDto>(`/v1/roles/${enc(id)}`, { name }, auth)),

  deleteRole: async (id) => {
    await httpClient.delete<void>(`/v1/roles/${enc(id)}`, auth);
  },

  getRole: async (id) => {
    const dto = await orNull(httpClient.get<RolePermissionDto>(`/v1/roles/${enc(id)}/permissions`, auth));
    return dto ? toRoleWithPermissions(dto) : null;
  },

  setRolePermissions: async (id, permissionIds) =>
    toRoleWithPermissions(
      await httpClient.put<RolePermissionDto>(
        `/v1/roles/${enc(id)}/permissions`,
        { permissionIds: permissionIds.map(Number) },
        auth,
      ),
    ),

  listUsers: async (query = {}) =>
    toUserPage(
      await httpClient.get<UserPageDto>("/v1/users", {
        ...auth,
        query: {
          page: query.page,
          pageSize: query.pageSize,
          search: query.search,
          isActive: query.isActive,
          roleName: query.roleName,
        },
      }),
    ),

  getUser: async (id) => {
    const dto = await orNull(httpClient.get<UserDto>(`/v1/users/${enc(id)}`, auth));
    return dto ? toUser(dto) : null;
  },

  createUser: async (draft) => toUser(await httpClient.post<UserDto>("/v1/users/normal-user", newUserForm(draft), auth)),

  updateUser: async (id, draft) => toUser(await httpClient.put<UserDto>(`/v1/users/${enc(id)}`, userBody(draft), auth)),

  deleteUser: async (id) => {
    await httpClient.delete<void>(`/v1/users/${enc(id)}`, auth);
  },

  listRolePermissionsOfUser: async (id) =>
    (await httpClient.get<readonly UserPermissionDto[]>(`/v1/users/${enc(id)}/role-based-permissions`, auth)).map(
      toUserPermission,
    ),

  listDirectPermissions: async (id) =>
    (await httpClient.get<readonly UserPermissionDto[]>(`/v1/users/${enc(id)}/direct-permissions`, auth)).map(
      toUserPermission,
    ),

  setDirectPermissions: async (id, overrides) =>
    (
      await httpClient.put<readonly UserPermissionDto[]>(
        `/v1/users/${enc(id)}/permissions`,
        { permissions: overrides.map((entry) => ({ permissionId: Number(entry.permissionId), isGranted: entry.isGranted })) },
        auth,
      )
    ).map(toUserPermission),
};
