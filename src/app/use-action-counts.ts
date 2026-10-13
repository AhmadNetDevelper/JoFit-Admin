import { useContext } from "react";

import { ActionCountsContext, type ActionCounts } from "./action-counts-context";

/** How many things are waiting behind each screen, keyed by route. */
export function useActionCounts(): ActionCounts {
  return useContext(ActionCountsContext);
}
