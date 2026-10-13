import { useCallback, useEffect, useRef, useState } from "react";

import { toAppError, type AppError } from "@/lib";

export interface AsyncDataState<TData> {
  readonly data: TData | undefined;
  readonly error: AppError | undefined;
  readonly isLoading: boolean;
  /** True while re-fetching with data already on screen. */
  readonly isRefreshing: boolean;
  refetch: () => void;
}

/**
 * Read-side request state: loading, error, data, refetch.
 *
 * This is NOT a query cache, and deliberately so. A half-built cache with
 * invalidation bugs is worse than no cache; if the admin later needs shared
 * caching, background refetching or optimistic lists, that is the point to adopt
 * TanStack Query — and it slots in behind this same hook signature.
 *
 * `deps` identifies the request. Changing them re-runs it and discards any
 * in-flight response, so a fast second request can never be overwritten by a
 * slow first one.
 *
 * **Every dep must be stable across renders.** An object or array literal in
 * `deps` is a new value each time, so the effect re-runs, sets state, renders,
 * and re-runs again — a fetch loop that never settles and locks the tab. Pass
 * primitives, or something memoised: `useListQuery` returns a `query` that is
 * memoised for exactly this reason.
 */
export function useAsyncData<TData>(
  fetcher: (signal: AbortSignal) => Promise<TData>,
  deps: readonly unknown[],
): AsyncDataState<TData> {
  const [data, setData] = useState<TData>();
  const [error, setError] = useState<AppError>();
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // Keeps the latest fetcher without making it a dependency of the effect.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const hasData = data !== undefined;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(undefined);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(toAppError(cause));
        setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  return {
    data,
    error,
    isLoading: isLoading && !hasData,
    isRefreshing: isLoading && hasData,
    refetch,
  };
}
