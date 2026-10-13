import { cn } from "cn";
import { useLayoutEffect, useRef, type ReactNode } from "react";

import type { AsyncDataState } from "@/hooks";
import { reveal } from "@/lib/reveal";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { PendingState } from "./pending-state";

/**
 * Renders the four states of a fetched screen in one place: pending, error,
 * empty, loaded.
 *
 * Without this, every screen re-implements the same `if (isLoading) … if (error)
 * …` ladder and they drift apart. Screens describe *what* is empty; this decides
 * how each state is presented.
 */
export function AsyncBoundary<TData>({
  state,
  children,
  isEmpty,
  pendingLabel,
  pendingRows,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  state: AsyncDataState<TData>;
  children: (data: TData) => ReactNode;
  isEmpty?: (data: TData) => boolean;
  pendingLabel?: string;
  pendingRows?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  if (state.isLoading) {
    return <PendingState label={pendingLabel} rows={pendingRows} />;
  }

  if (state.error) {
    return <ErrorState error={state.error} onRetry={state.refetch} />;
  }

  if (state.data === undefined) {
    return <ErrorState onRetry={state.refetch} />;
  }

  if (isEmpty?.(state.data)) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  /*
   * The loaded branch carries the vertical rhythm for every screen's sections.
   *
   * It has to live here rather than on each screen: this wrapper is the parent
   * of the section list, so a `gap` on the screen's own root would apply to this
   * one element and never reach the sections inside it. That was the bug — every
   * admin screen rendered its sections flush against each other.
   *
   * The gap is a flat 24px, not `gap-4 md:gap-6`. The header-to-content distance
   * has two owners — this wrapper on the detail screens, where PageHeader sits
   * inside it, and the shell on the list screens, where it sits outside — and
   * they only agree if both are one value at every width. A vertical gap also
   * competes with nothing on a narrow screen, so it has no reason to shrink the
   * way the shell's horizontal gutter does.
   */
  return (
    <Loaded isRefreshing={state.isRefreshing}>
      {children(state.data)}
    </Loaded>
  );
}

/**
 * The loaded branch, arriving.
 *
 * It mounts once, when the data first lands — a refetch keeps it mounted and
 * only dims it — so the entrance plays on arrival and never again while the
 * screen is open. `useLayoutEffect`, so the first frame the reader sees is
 * already the start of the animation rather than the finished content
 * followed by a jump back.
 *
 * `data-reveal-self` tells the shell's own screen entrance to leave this block
 * alone; otherwise the two would stack and the content would rise twice as far.
 */
function Loaded({ isRefreshing, children }: { isRefreshing: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => reveal(ref.current), []);

  return (
    <div
      ref={ref}
      data-reveal-self
      aria-busy={isRefreshing}
      className={cn("flex flex-col gap-6 transition-opacity", isRefreshing && "opacity-60")}
    >
      {children}
    </div>
  );
}
