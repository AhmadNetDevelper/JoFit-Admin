import type { ReactNode } from "react";

import { PaginationControls } from "@/components/data-table";
import { ErrorState, PendingState } from "@/components/feedback";
import type { AsyncDataState } from "@/hooks";
import type { Paginated } from "@/types";

/**
 * The rows of a sub-list inside a flush `Section`, with the pager on its own
 * ruled strip underneath — the same footer a list screen's `ListCard` has.
 * While another page loads the current one stays, dimmed.
 */
export function SubListBody<TRow>({
  state,
  onPageChange,
  children,
}: {
  state: AsyncDataState<Paginated<TRow>>;
  onPageChange: (page: number) => void;
  children: (rows: readonly TRow[]) => ReactNode;
}) {
  if (state.isLoading) {
    return (
      <div className="p-4">
        <PendingState rows={3} />
      </div>
    );
  }
  if (state.error || !state.data) {
    return (
      <div className="p-4">
        <ErrorState error={state.error} onRetry={state.refetch} />
      </div>
    );
  }
  return (
    <div aria-busy={state.isRefreshing} className={state.isRefreshing ? "opacity-60" : undefined}>
      {children(state.data.items)}
      <div className="border-t px-4 py-3">
        <PaginationControls meta={state.data.meta} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
