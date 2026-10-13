import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Which statuses a list is narrowed to, held in the URL as `?status=a,b`.
 *
 * In the URL for the same reason as every other piece of list state: "here is
 * the queue I am looking at" has to survive a refresh and a pasted link. An
 * empty selection means every status, never none.
 */
export function useStatusParam<TStatus extends string>(
  allowed: readonly TStatus[],
): [readonly TStatus[] | undefined, (next: readonly TStatus[]) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("status");
  const selected = raw
    ? (raw.split(",").filter((value) => (allowed as readonly string[]).includes(value)) as TStatus[])
    : [];

  const set = useCallback(
    (next: readonly TStatus[]) => {
      const updated = new URLSearchParams(params);
      if (next.length > 0) updated.set("status", next.join(","));
      else updated.delete("status");
      updated.delete("page");
      setParams(updated, { replace: true });
    },
    [params, setParams],
  );

  return [selected.length > 0 ? selected : undefined, set];
}
