import type { Permission } from "@/types";

import type { AdminRole, AdminSession } from "./types";

/**
 * Role → permission policy. This is business logic, which is why it lives in the
 * auth feature rather than in `config/`.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SECURITY — READ THIS BEFORE RELYING ON IT
 *
 * Everything here runs in the browser and can be edited by anyone with dev
 * tools. It decides what the UI *offers*, nothing more. Every permission must be
 * enforced again on the server, against the session, on every request. A screen
 * hidden here is still reachable by calling the API directly.
 *
 * Treat this file as navigation and affordance logic, never as access control.
 * ──────────────────────────────────────────────────────────────────────────
 */
const ALL: readonly Permission[] = [
  "catalogue:read",
  "catalogue:write",
  "rental:read",
  "rental:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "customers:write",
  "coaches:read",
  "coaches:write",
  "education:read",
  "education:write",
  "reviews:read",
  "reviews:moderate",
  "content:read",
  "content:write",
  "quotations:read",
  "quotations:write",
  "careers:read",
  "careers:write",
  "community:moderate",
  "support:reply",
  "sports:write",
  "lookups:write",
  "users:write",
  "settings:write",
];

export const rolePermissions: Readonly<Record<AdminRole, readonly Permission[]>> = {
  owner: ALL,
  /* Changing who may do what on the platform stays with the owner, like settings. */
  manager: ALL.filter((permission) => permission !== "settings:write" && permission !== "users:write"),
  "catalogue-editor": [
    "catalogue:read",
    "catalogue:write",
    "rental:read",
    "rental:write",
    "sports:write",
    "lookups:write",
    "reviews:read",
  ],
  /* The careers board is editorial work too: verifying employers and reviewing jobs. */
  "content-editor": [
    "content:read",
    "content:write",
    "community:moderate",
    "reviews:read",
    "careers:read",
    "careers:write",
  ],
  support: [
    "orders:read",
    "orders:write",
    "customers:read",
    "customers:write",
    "rental:read",
    "quotations:read",
    "quotations:write",
    "reviews:read",
    "support:reply",
    /* To answer a candidate or an employer who writes in; decisions stay with content. */
    "careers:read",
  ],
  viewer: [
    "catalogue:read",
    "rental:read",
    "orders:read",
    "customers:read",
    "coaches:read",
    "education:read",
    "reviews:read",
    "content:read",
    "quotations:read",
    "careers:read",
  ],
};

export function permissionsForRole(role: AdminRole): readonly Permission[] {
  return rolePermissions[role];
}

export function can(session: AdminSession | null, permission: Permission): boolean {
  return session?.permissions.includes(permission) ?? false;
}

export function canAny(session: AdminSession | null, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(session, permission));
}
