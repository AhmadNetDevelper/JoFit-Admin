import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { authService } from "../services";
import type { AdminSession, SignInInput } from "../types";
import { SessionContext, type SessionContextValue } from "./session-context";

/**
 * The session is the admin's only global client state — everything else is
 * server state fetched per screen, or URL state. One provider is the
 * proportionate answer; no state library is installed.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    let active = true;
    authService
      .getSession()
      .then((resolved) => {
        if (active) setSession(resolved);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setIsResolved(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    const next = await authService.signIn(input);
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, isResolved, signIn, signOut }),
    [session, isResolved, signIn, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
