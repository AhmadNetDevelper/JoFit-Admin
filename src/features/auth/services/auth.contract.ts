import type { ListQuery, Paginated } from "@/types";

import type { AdminSession, AdminUser, CreatedStaff, SignInInput, StaffDraft } from "../types";

/**
 * FEATURE BOUNDARY. There is no identity provider, so `signIn` does not check a
 * password — the mock adapter resolves a session from a known email so every
 * role can be exercised during development.
 *
 * OPEN BUSINESS DECISIONS: the identity provider, whether staff use SSO, session
 * lifetime, and MFA.
 */
export interface AuthService {
  signIn(input: SignInInput): Promise<AdminSession>;
  signOut(): Promise<void>;
  /** Resolves the session from the server on boot; `null` when signed out. */
  getSession(): Promise<AdminSession | null>;
  /**
   * Every staff account, for the assignee pickers (quotations, support) —
   * `GET /v1/admin/staff/options`. A team is small, so it is the whole list.
   */
  listStaff(): Promise<readonly AdminUser[]>;
  /**
   * One page of the team, for the Team and Settings tables — `GET /v1/admin/staff`.
   * `search` matches the name or the email; sorted by name.
   */
  listStaffPage(query?: ListQuery): Promise<Paginated<AdminUser>>;
  /**
   * 422 for a missing name, a bad or taken email, or an unknown role. No
   * password is sent, so the API generates one and returns it once as
   * `temporaryPassword` — the caller must show it, or it is lost.
   */
  createStaff(draft: StaffDraft): Promise<CreatedStaff>;
  /** 409 when it would leave the team without an owner. */
  updateStaff(id: string, draft: StaffDraft): Promise<AdminUser>;
  /** 409 for your own account, or the last owner. */
  deleteStaff(id: string): Promise<void>;
}
