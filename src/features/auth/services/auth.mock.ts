import { AppError, notFound, paginate, validationFailed } from "@/lib";
import { mockAdminUsers } from "@/mocks/auth";
import { matchesText, simulateLatency } from "@/mocks/runtime";

import { permissionsForRole } from "../permissions";
import { ADMIN_ROLES, type AdminSession, type AdminUser, type StaffDraft } from "../types";
import type { AuthService } from "./auth.contract";

/**
 * Development-only sign-in: any known email is accepted and the password is
 * ignored, because there is nothing to check it against. This is never a login
 * implementation — it exists so each role's UI can be walked through.
 *
 * The session is held in memory only. It is deliberately NOT persisted to
 * localStorage: a real session belongs in an httpOnly cookie the browser sends
 * and JavaScript cannot read.
 */
let currentSession: AdminSession | null = null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStaff(draft: StaffDraft, id?: string): StaffDraft {
  const clean = { name: draft.name.trim(), email: draft.email.trim().toLowerCase(), role: draft.role };
  const errors: Record<string, string> = {};
  if (clean.name.length < 2) errors.name = "Their full name.";
  if (!EMAIL.test(clean.email)) errors.email = "A valid email address.";
  else if (mockAdminUsers.some((user) => user.email === clean.email && user.id !== id)) {
    errors.email = "Someone on the team already uses this email.";
  }
  if (!ADMIN_ROLES.includes(clean.role)) errors.role = "Choose a role.";
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  return clean;
}

/** The team must always keep at least one owner — nobody else can manage staff. */
function owners(except?: string): number {
  return mockAdminUsers.filter((user) => user.role === "owner" && user.id !== except).length;
}

export const mockAuthService: AuthService = {
  async signIn({ email }) {
    await simulateLatency();
    const user = mockAdminUsers.find(
      (entry) => entry.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user) {
      throw new AppError("unauthorized", "No admin account matches that email address.");
    }
    currentSession = { user, permissions: permissionsForRole(user.role) };
    return currentSession;
  },

  async signOut() {
    await simulateLatency();
    currentSession = null;
  },

  async getSession() {
    await simulateLatency();
    return currentSession;
  },

  async listStaff() {
    await simulateLatency();
    return mockAdminUsers;
  },

  async listStaffPage(query = {}) {
    await simulateLatency();
    const locale = query.locale ?? "en";
    const rows = mockAdminUsers.filter((user) => matchesText([user.name, user.email], query.search));
    const key = (user: AdminUser) =>
      query.sort?.field === "email" ? user.email : query.sort?.field === "role" ? user.role : user.name;
    const sorted = [...rows].sort((a, b) => key(a).localeCompare(key(b), locale));
    const ordered = query.sort?.direction === "desc" ? sorted.reverse() : sorted;
    /* A page past the end answers the last one, as the API does — `paginate` sees to it. */
    return paginate(ordered, query);
  },

  async createStaff(draft) {
    await simulateLatency();
    const user: AdminUser = { ...validateStaff(draft), id: `admin-${crypto.randomUUID().slice(0, 8)}` };
    mockAdminUsers.push(user);
    /* Like the API, a draft without a password gets a generated one, returned once.
       Sign-in here ignores passwords, so it only exercises the Team screen's hand-over. */
    return { ...user, temporaryPassword: crypto.randomUUID().replace(/-/g, "").slice(0, 12) };
  },

  async updateStaff(id, draft) {
    await simulateLatency();
    const index = mockAdminUsers.findIndex((user) => user.id === id);
    if (index < 0) throw notFound(`Staff member "${id}"`);
    const clean = validateStaff(draft, id);
    if (mockAdminUsers[index]!.role === "owner" && clean.role !== "owner" && owners(id) === 0) {
      throw new AppError("conflict", "This is the only owner. Make someone else an owner first.", { status: 409 });
    }
    const user: AdminUser = { ...clean, id };
    mockAdminUsers[index] = user;
    return user;
  },

  async deleteStaff(id) {
    await simulateLatency();
    const index = mockAdminUsers.findIndex((user) => user.id === id);
    if (index < 0) throw notFound(`Staff member "${id}"`);
    if (currentSession?.user.id === id) {
      throw new AppError("conflict", "You cannot remove your own account.", { status: 409 });
    }
    if (mockAdminUsers[index]!.role === "owner" && owners(id) === 0) {
      throw new AppError("conflict", "This is the only owner. Make someone else an owner first.", { status: 409 });
    }
    mockAdminUsers.splice(index, 1);
  },
};
