import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { useTranslation } from "@/i18n";
import { readNumberParam } from "@/lib";
import type { ListQuery, SortState } from "@/types";

export interface ListQueryState<TField extends string> {
  readonly query: ListQuery<TField>;
  setSearch: (term: string) => void;
  setPage: (page: number) => void;
  setSort: (sort: SortState<TField>) => void;
  setFlag: (key: string, value: boolean) => void;
  readonly flags: Readonly<Record<string, boolean>>;
}

/**
 * List state lives in the URL, not in component state.
 *
 * That makes a filtered admin view shareable — "here is the exact screen I am
 * looking at" is a daily need for support staff — and it survives a refresh.
 * The active locale is folded in so the service sorts and searches in the
 * language the user is actually reading.
 */
export function useListQuery<TField extends string>(
  options: { defaultSort?: SortState<TField>; pageSize?: number } = {},
): ListQueryState<TField> {
  const [params, setParams] = useSearchParams();
  const { locale } = useTranslation();

  const sortField = params.get("sortField") as TField | null;
  const sortDirection = params.get("sortDir") === "desc" ? "desc" : "asc";

  /*
   * Every caller writes its defaults inline —
   * `useListQuery({ defaultSort: { field: "title", direction: "asc" } })` —
   * so `options` and `options.defaultSort` are new objects on every render.
   *
   * Depending on those objects would make `query` a new object on every render
   * too, which re-runs the `useAsyncData` effect that has `query` in its deps,
   * which sets state, which renders again: a fetch loop that never settles.
   *
   * Reading the two primitive fields out first breaks that. Strings and
   * undefined compare by value, so `query` only changes when the query really
   * has — and callers can keep writing the readable inline form.
   */
  const defaultSortField = options.defaultSort?.field;
  const defaultSortDirection = options.defaultSort?.direction;
  const { pageSize } = options;

  const query = useMemo<ListQuery<TField>>(
    () => ({
      page: readNumberParam(params, "page") ?? 1,
      pageSize,
      search: params.get("q") ?? undefined,
      sort: sortField
        ? { field: sortField, direction: sortDirection }
        : defaultSortField
          ? { field: defaultSortField, direction: defaultSortDirection ?? "asc" }
          : undefined,
      locale,
    }),
    [params, sortField, sortDirection, locale, pageSize, defaultSortField, defaultSortDirection],
  );

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params);
      mutate(next);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const setSearch = useCallback(
    (term: string) =>
      update((next) => {
        if (term) next.set("q", term);
        else next.delete("q");
        // A new search invalidates the current page number.
        next.delete("page");
      }),
    [update],
  );

  const setPage = useCallback(
    (page: number) =>
      update((next) => {
        if (page > 1) next.set("page", String(page));
        else next.delete("page");
      }),
    [update],
  );

  const setSort = useCallback(
    (sort: SortState<TField>) =>
      update((next) => {
        next.set("sortField", sort.field);
        next.set("sortDir", sort.direction);
        next.delete("page");
      }),
    [update],
  );

  const setFlag = useCallback(
    (key: string, value: boolean) =>
      update((next) => {
        if (value) next.set(key, "1");
        else next.delete(key);
        next.delete("page");
      }),
    [update],
  );

  const flags = useMemo(() => {
    const entries: Record<string, boolean> = {};
    for (const [key, value] of params.entries()) {
      if (value === "1") entries[key] = true;
    }
    return entries;
  }, [params]);

  return { query, setSearch, setPage, setSort, setFlag, flags };
}
