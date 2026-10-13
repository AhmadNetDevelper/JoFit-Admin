import type { ListQuery } from "@/types";

/**
 * The paging, sorting and searching every admin list shares, as URL
 * parameters:
 *
 *   page=2&pageSize=20&search=hussein&locale=ar&sortField=placedAt&sortDir=desc
 *
 * `sortField`/`sortDir` are the same names the admin keeps in its own URL, so
 * a filtered screen and the request behind it read alike. Domain filters are
 * added beside these by each adapter; a list value repeats its key
 * (`statuses=pending&statuses=confirmed`).
 */
export function adminListParams(query: ListQuery = {}): Record<string, unknown> {
  return {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    locale: query.locale,
    sortField: query.sort?.field,
    sortDir: query.sort?.direction,
  };
}
