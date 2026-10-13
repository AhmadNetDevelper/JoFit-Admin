import { useState } from "react";

import { useAsyncData } from "@/hooks";
import type { Paginated } from "@/types";

/** Rows per page in a related table on a record page. */
export const SUB_LIST_PAGE_SIZE = 10;

/**
 * A related list on a record page — a coach's sessions, the places on a
 * course. It reads one page of the collection filtered to the record
 * (`GET /v1/admin/coach-bookings?coachId=…&page=…`), never an array embedded
 * in the record, so a coach with four hundred sessions loads ten.
 *
 * The page lives in component state, not the URL: the URL already belongs to
 * the record, and a page has more than one of these lists. Key the component
 * by its filter to start again at page one when the filter changes.
 */
export function useSubList<TRow>(load: (page: number) => Promise<Paginated<TRow>>, deps: readonly unknown[]) {
  const [page, setPage] = useState(1);
  const state = useAsyncData(() => load(page), [...deps, page]);
  return { state, setPage };
}
