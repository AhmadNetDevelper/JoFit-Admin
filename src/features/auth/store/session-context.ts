import { createContext } from "react";

import type { AdminSession, SignInInput } from "../types";

export interface SessionContextValue {
  readonly session: AdminSession | null;
  /** False until the session has been resolved on boot. */
  readonly isResolved: boolean;
  signIn(input: SignInInput): Promise<AdminSession>;
  signOut(): Promise<void>;
}

/**
 * Kept in its own module (no components) so the provider file can stay a
 * component-only module — which is what lets fast refresh work reliably.
 */
export const SessionContext = createContext<SessionContextValue | null>(null);
