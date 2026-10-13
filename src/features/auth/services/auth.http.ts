import { AppError } from "@/lib";
import { adminListParams, clearTokens, httpClient, readTokens, writeTokens, type TokenPair } from "@/services";
import { PERMISSIONS, type PageMeta, type Paginated, type Permission } from "@/types";

import { ADMIN_ROLES, type AdminRole, type AdminSession, type AdminUser, type CreatedStaff, type StaffDraft } from "../types";
import type { AuthService } from "./auth.contract";

const enc = encodeURIComponent;

/* ---- live DTO shapes (docs/api-live/admin.json) ---------------------------- */

/** `AdminUserDto` — an int64 id and a free-text role. */
interface AdminUserDto {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

/** `AdminUserCreatedDto` — `POST /admin/staff` only. */
interface AdminUserCreatedDto extends AdminUserDto {
  readonly temporaryPassword: string | null;
}

/** `AdminSessionDto` — the permissions are free strings on the wire. */
interface AdminSessionDto {
  readonly user: AdminUserDto;
  readonly permissions: readonly string[];
}

/**
 * `PagedResultOfAdminUserDto` — the live response nests a `meta` carrying this
 * admin's own `PageMeta` shape, same as every other adapter's paged read; the
 * flat `page`/`pageSize`/`totalCount` fields are kept only as a fallback.
 */
interface AdminUserPageDto {
  readonly items: readonly AdminUserDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
  readonly hasNextPage?: boolean;
  readonly hasPreviousPage?: boolean;
  readonly meta?: PageMeta;
}

const KNOWN_ROLES: ReadonlySet<string> = new Set(ADMIN_ROLES);
const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(PERMISSIONS);

/**
 * The spec types `role` as a plain string. Casing and separators are
 * normalised ("CatalogueEditor" → "catalogue-editor"); a role outside the six
 * falls back to the least-privileged one, because every staff table indexes
 * `rolePermissions` by it. What a signed-in user may do never comes from this —
 * it comes from the session's own `permissions`.
 */
function toRole(wire: string): AdminRole {
  const role = wire
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
  return KNOWN_ROLES.has(role) ? (role as AdminRole) : "viewer";
}

function toAdminUser(dto: AdminUserDto): AdminUser {
  return { id: String(dto.id), name: dto.name, email: dto.email, role: toRole(dto.role) };
}

/**
 * The live API has no single `lookups:write` or `users:write` permission —
 * it grants per-table CRUD instead (`academicdegrees:create`, `users:update`,
 * …). This admin's nav and write-guards are built against the coarser pair
 * the brief specified, so holding a write permission on any one table a
 * screen covers stands in for that screen's combined permission.
 */
const LOOKUP_TABLE_PREFIXES = [
  "academicdegrees",
  "cities",
  "countries",
  "jobstatuses",
  "jobtypes",
  "universitymajors",
  "userjobtypes",
] as const;

function deriveCombinedPermissions(raw: readonly string[]): readonly string[] {
  const set = new Set(raw);
  const hasAny = (candidates: readonly string[]) => candidates.some((permission) => set.has(permission));

  if (hasAny(["users:create", "users:update", "users:delete"])) set.add("users:write");
  if (LOOKUP_TABLE_PREFIXES.some((table) => hasAny([`${table}:create`, `${table}:update`, `${table}:delete`]))) {
    set.add("lookups:write");
  }
  return [...set];
}

/**
 * The spec does not pin the permission vocabulary; anything outside this
 * admin's own (`types/permissions.ts`) could never satisfy a `can()` check, so
 * it is dropped rather than carried as a mistyped string.
 */
function toSession(dto: AdminSessionDto): AdminSession {
  return {
    user: toAdminUser(dto.user),
    permissions: deriveCombinedPermissions(dto.permissions).filter(
      (permission): permission is Permission => KNOWN_PERMISSIONS.has(permission),
    ),
  };
}

function toStaffPage(dto: AdminUserPageDto): Paginated<AdminUser> {
  const totalPages = dto.totalPages ?? Math.max(1, Math.ceil(dto.totalCount / Math.max(1, dto.pageSize)));
  const meta: PageMeta = dto.meta ?? {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalCount,
    totalPages,
    hasNextPage: dto.hasNextPage ?? dto.page < totalPages,
    hasPreviousPage: dto.hasPreviousPage ?? dto.page > 1,
  };
  return {
    items: dto.items.map(toAdminUser),
    meta,
  };
}

/** `StaffDraftRequest`. Its optional `password` is never sent, so the API generates one on create. */
const staffBody = (draft: StaffDraft) => ({ name: draft.name, email: draft.email, role: draft.role });

const fetchSession = async () =>
  toSession(await httpClient.get<AdminSessionDto>("/v1/admin/auth/session", { auth: true }));

/**
 * Staff sessions over `/v1/admin/auth/*`.
 *
 * Sign-in returns a bearer token pair (`AdminTokenResponse`), not a user — so
 * `signIn` stores the tokens and then fetches `/auth/session` to get the
 * `{user, permissions}` shape the rest of the admin expects. Every other call
 * here passes `auth: true`, which attaches the stored access token and
 * silently refreshes it once on a 401 (see `services/http/client.ts`).
 */
export const httpAuthService: AuthService = {
  async signIn(input) {
    const tokens = await httpClient.post<TokenPair>("/v1/admin/auth/sign-in", input);
    writeTokens(tokens);
    try {
      return await fetchSession();
    } catch (error) {
      clearTokens();
      throw error;
    }
  },

  async signOut() {
    const refreshToken = readTokens()?.refreshToken;
    try {
      await httpClient.post<void>("/v1/admin/auth/sign-out", { refreshToken });
    } finally {
      // Signing out locally must work even when the API cannot be reached.
      clearTokens();
    }
  },

  getSession: async () => {
    if (!readTokens()) return null;
    try {
      return await fetchSession();
    } catch (error) {
      // No token, or an expired one the refresh attempt couldn't save, is "signed out" rather than an error.
      if (error instanceof AppError && error.code === "unauthorized") return null;
      throw error;
    }
  },

  listStaff: async () =>
    (await httpClient.get<readonly AdminUserDto[]>("/v1/admin/staff/options", { auth: true })).map(toAdminUser),
  listStaffPage: async (query = {}) =>
    toStaffPage(
      await httpClient.get<AdminUserPageDto>("/v1/admin/staff", { query: adminListParams(query), auth: true }),
    ),
  createStaff: async (draft): Promise<CreatedStaff> => {
    const dto = await httpClient.post<AdminUserCreatedDto>("/v1/admin/staff", staffBody(draft), { auth: true });
    return { ...toAdminUser(dto), temporaryPassword: dto.temporaryPassword || null };
  },
  updateStaff: async (id, draft) =>
    toAdminUser(await httpClient.put<AdminUserDto>(`/v1/admin/staff/${enc(id)}`, staffBody(draft), { auth: true })),
  deleteStaff: async (id) => {
    await httpClient.delete<void>(`/v1/admin/staff/${enc(id)}`, { auth: true });
  },
};
