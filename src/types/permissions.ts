/**
 * The permission *vocabulary*, kept here rather than in `features/auth` so that
 * navigation config and UI guards can reference a permission without depending
 * on the auth domain. The *policy* — which role holds which permission — lives
 * in `features/auth`, because that is business logic.
 *
 * SECURITY: these strings gate what the UI *offers*. They are not, and can never
 * be, a security boundary — see `features/auth/README` note.
 */
export const PERMISSIONS = [
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
] as const;

export type Permission = (typeof PERMISSIONS)[number];
