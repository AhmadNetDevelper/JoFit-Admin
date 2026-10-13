import { Navigate, Outlet, useLocation } from "react-router-dom";

import { PendingState } from "@/components/feedback";

import { useSession } from "../hooks/use-session";

/**
 * Route guard. It keeps signed-out users out of admin screens as a matter of UX,
 * and remembers where they were going so sign-in can return them there.
 *
 * It is not a security control: the data behind these routes is protected by the
 * API, not by this component.
 */
export function RequireAuth() {
  const { session, isResolved } = useSession();
  const location = useLocation();

  if (!isResolved) {
    return <PendingState label="Checking your session" rows={2} />;
  }

  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
