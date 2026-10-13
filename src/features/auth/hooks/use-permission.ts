import type { Permission } from "@/types";

import { can } from "../permissions";
import { useSession } from "./use-session";

/**
 * Hides affordances the signed-in user cannot use. A UI convenience — the server
 * must enforce the same rule independently.
 */
export function usePermission(permission: Permission): boolean {
  const { session } = useSession();
  return can(session, permission);
}
