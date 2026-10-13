import type { PageMeta, PageRequest, Paginated } from "@/types";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * The page asked for, made safe: 1-based, and a size of 1–100 (20 when none
 * is given). A value that is not a number — from a URL or any HTTP client —
 * counts as not given.
 */
export function resolvePageRequest(query: { page?: number; pageSize?: number }): PageRequest {
  const whole = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
  const page = Math.max(1, whole(query.page, 1));
  const requested = whole(query.pageSize, DEFAULT_PAGE_SIZE);
  return { page, pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, requested)) };
}

export function createPageMeta(request: PageRequest, totalItems: number): PageMeta {
  const totalPages = Math.max(1, Math.ceil(totalItems / request.pageSize));
  return {
    ...request,
    totalItems,
    totalPages,
    hasNextPage: request.page < totalPages,
    hasPreviousPage: request.page > 1,
  };
}

/** In-memory slicing used by the mock adapters; the API will do this server-side. */
export function paginate<TItem>(
  items: readonly TItem[],
  query: { page?: number; pageSize?: number },
): Paginated<TItem> {
  /* A page past the end answers the LAST page — the API's rule too — so a list
     whose filter just shrank it never shows an empty page with a pager at 5. */
  const asked = resolvePageRequest(query);
  const lastPage = Math.max(1, Math.ceil(items.length / asked.pageSize));
  const request = { ...asked, page: Math.min(asked.page, lastPage) };
  const start = (request.page - 1) * request.pageSize;
  return {
    items: items.slice(start, start + request.pageSize),
    meta: createPageMeta(request, items.length),
  };
}
