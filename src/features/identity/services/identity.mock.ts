import { AppError, notFound, paginate, validationFailed } from "@/lib";
import { mockDirectPermissions, mockPermissions, mockRoles, mockUsers, type MockRole } from "@/mocks/identity";
import { matchesText, nextId, simulateLatency } from "@/mocks/runtime";

import type {
  NewUserDraft,
  PermissionOverride,
  PlatformUser,
  RoleWithPermissions,
  UserDraft,
  UserPermission,
} from "../types";
import type { IdentityService } from "./identity.contract";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireRole(id: string): MockRole {
  const role = mockRoles.find((entry) => entry.id === id);
  if (!role) throw notFound(`Role "${id}"`);
  return role;
}

function requireUserIndex(id: string): number {
  const index = mockUsers.findIndex((entry) => entry.id === id);
  if (index < 0) throw notFound(`User "${id}"`);
  return index;
}

function withPermissions(role: MockRole): RoleWithPermissions {
  return {
    id: role.id,
    name: role.name,
    permissions: mockPermissions.filter((permission) => role.permissionIds.includes(permission.id)),
  };
}

function validRoleName(name: string, id?: string): string {
  const clean = name.trim();
  if (!clean) throw validationFailed({ name: "Required." });
  if (clean.length > 256) throw validationFailed({ name: "At most 256 characters." });
  if (mockRoles.some((role) => role.id !== id && role.name.toLowerCase() === clean.toLowerCase())) {
    throw new AppError("conflict", "Another role already uses this name.", {
      status: 409,
      fieldErrors: { name: "Another role already uses this name." },
    });
  }
  return clean;
}

/** The API's rules for an account's details, shared by create and update. */
function validUser<TDraft extends UserDraft | NewUserDraft>(draft: TDraft, id?: string): TDraft {
  const errors: Record<string, string> = {};
  const userName = draft.userName.trim();
  if (userName.length < 3) errors.userName = "At least 3 characters.";
  else if (mockUsers.some((entry) => entry.id !== id && entry.userName.toLowerCase() === userName.toLowerCase())) {
    errors.userName = "Another account already uses this username.";
  }
  if (!EMAIL.test(draft.email.trim())) errors.email = "Enter a valid email address.";
  if (draft.phoneNumber.trim().length < 6) errors.phoneNumber = "At least 6 characters.";
  if (!draft.fullName.trim()) errors.fullName = "Required.";
  if (!draft.genderId) errors.genderId = "Choose one.";
  if ("password" in draft && draft.password.length < 6) errors.password = "At least 6 characters.";
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  return { ...draft, userName, email: draft.email.trim(), phoneNumber: draft.phoneNumber.trim(), fullName: draft.fullName.trim() };
}

function profileOf(draft: UserDraft | NewUserDraft): Partial<PlatformUser> {
  return {
    userName: draft.userName,
    email: draft.email,
    phoneNumber: draft.phoneNumber,
    fullName: draft.fullName,
    birthDate: draft.birthDate ? `${draft.birthDate}T00:00:00Z` : undefined,
    genderId: draft.genderId,
    countryId: draft.countryId || undefined,
    cityId: draft.cityId || undefined,
    jobStatusId: draft.jobStatusId || undefined,
  };
}

function asUserPermissions(entries: readonly PermissionOverride[]): UserPermission[] {
  return entries.flatMap((entry) => {
    const permission = mockPermissions.find((candidate) => candidate.id === entry.permissionId);
    return permission
      ? [{ permissionId: permission.id, name: permission.name, resource: permission.resource, action: permission.action, isGranted: entry.isGranted }]
      : [];
  });
}

export const mockIdentityService: IdentityService = {
  async listPermissions() {
    await simulateLatency();
    return mockPermissions;
  },

  async listRoles() {
    await simulateLatency();
    return mockRoles.map(({ id, name }) => ({ id, name }));
  },

  async createRole(draft) {
    await simulateLatency();
    const name = validRoleName(draft.name);
    const source = draft.cloneFromRoleId ? requireRole(draft.cloneFromRoleId) : undefined;
    const role: MockRole = { id: nextId("role"), name, permissionIds: [...(source?.permissionIds ?? [])] };
    mockRoles.push(role);
    return { id: role.id, name: role.name };
  },

  async renameRole(id, name) {
    await simulateLatency();
    const role = requireRole(id);
    role.name = validRoleName(name, id);
    for (const [index, entry] of mockUsers.entries()) {
      if (entry.roleId === id) mockUsers[index] = { ...entry, roleName: role.name };
    }
    return { id: role.id, name: role.name };
  },

  async deleteRole(id) {
    await simulateLatency();
    requireRole(id);
    const holders = mockUsers.filter((entry) => entry.roleId === id).length;
    if (holders > 0) {
      throw new AppError("conflict", `${holders} account(s) still hold this role.`, { status: 409 });
    }
    mockRoles.splice(
      mockRoles.findIndex((role) => role.id === id),
      1,
    );
  },

  async getRole(id) {
    await simulateLatency();
    const role = mockRoles.find((entry) => entry.id === id);
    return role ? withPermissions(role) : null;
  },

  async setRolePermissions(id, permissionIds) {
    await simulateLatency();
    const role = requireRole(id);
    const known = new Set(mockPermissions.map((permission) => permission.id));
    role.permissionIds = [...new Set(permissionIds)].filter((permissionId) => known.has(permissionId));
    return withPermissions(role);
  },

  async listUsers(query = {}) {
    await simulateLatency();
    const rows = mockUsers
      .filter((entry) => matchesText([entry.fullName, entry.userName, entry.email, entry.phoneNumber], query.search))
      .filter((entry) => query.isActive === undefined || entry.isActive === query.isActive)
      .filter((entry) => !query.roleName || entry.roleName === query.roleName)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    return paginate(rows, query);
  },

  async getUser(id) {
    await simulateLatency();
    return mockUsers.find((entry) => entry.id === id) ?? null;
  },

  async createUser(draft) {
    await simulateLatency();
    const clean = validUser(draft);
    const role = mockRoles.find((entry) => entry.name === "User");
    const created: PlatformUser = {
      id: nextId("user"),
      isActive: true,
      ...profileOf(clean),
      userName: clean.userName,
      email: clean.email,
      fullName: clean.fullName,
      ...(role ? { roleId: role.id, roleName: role.name } : {}),
    };
    mockUsers.push(created);
    return created;
  },

  async updateUser(id, draft) {
    await simulateLatency();
    const index = requireUserIndex(id);
    const clean = validUser(draft, id);
    const current = mockUsers[index] as PlatformUser;
    const updated: PlatformUser = { ...current, ...profileOf(clean), userName: clean.userName, email: clean.email, fullName: clean.fullName, isActive: clean.isActive };
    mockUsers[index] = updated;
    return updated;
  },

  async deleteUser(id) {
    await simulateLatency();
    mockUsers.splice(requireUserIndex(id), 1);
    delete mockDirectPermissions[id];
  },

  async listRolePermissionsOfUser(id) {
    await simulateLatency();
    const current = mockUsers[requireUserIndex(id)] as PlatformUser;
    const role = mockRoles.find((entry) => entry.id === current.roleId);
    return asUserPermissions((role?.permissionIds ?? []).map((permissionId) => ({ permissionId, isGranted: true })));
  },

  async listDirectPermissions(id) {
    await simulateLatency();
    requireUserIndex(id);
    return asUserPermissions(mockDirectPermissions[id] ?? []);
  },

  async setDirectPermissions(id, overrides) {
    await simulateLatency();
    requireUserIndex(id);
    const known = new Set(mockPermissions.map((permission) => permission.id));
    const unknown = overrides.find((entry) => !known.has(entry.permissionId));
    if (unknown) throw validationFailed({ permissions: `Unknown permission "${unknown.permissionId}".` });
    const saved = overrides.map((entry) => ({ ...entry }));
    mockDirectPermissions[id] = saved;
    return asUserPermissions(saved);
  },
};
