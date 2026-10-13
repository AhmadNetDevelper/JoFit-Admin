import type { ReactNode } from "react";

import { StateMessage } from "@/components/feedback";
import type { Permission } from "@/types";

import { usePermission } from "../hooks/use-permission";

/**
 * Wraps a screen or an action that needs a specific permission. Renders an
 * explicit refusal rather than an empty page, so staff can tell "you cannot do
 * this" from "this is broken".
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const allowed = usePermission(permission);

  if (!allowed) {
    return (
      <StateMessage
        tone="error"
        title="You do not have access to this"
        description={`This screen requires the "${permission}" permission. Ask an owner to change your role.`}
      />
    );
  }

  return children;
}
