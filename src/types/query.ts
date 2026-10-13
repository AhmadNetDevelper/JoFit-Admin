import type { Locale } from "@/i18n/locales";

export type SortDirection = "asc" | "desc";

/**
 * Admin sorting is a field + direction pair, unlike the storefront's opaque sort
 * keys. The difference is intentional: a public catalogue exposes a small fixed
 * set of curated sort views, while an admin table lets staff sort by any column
 * they can see.
 */
export interface SortState<TField extends string = string> {
  readonly field: TField;
  readonly direction: SortDirection;
}

export interface NumericRange {
  readonly min?: number;
  readonly max?: number;
}

export interface DateRange {
  /** ISO-8601 date, `YYYY-MM-DD`. */
  readonly from: string;
  readonly to: string;
}

/** Every admin list query extends this. */
export interface ListQuery<TSortField extends string = string> {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sort?: SortState<TSortField>;
  /**
   * The language the list is being read in. It affects *sorting* and *searching*
   * of localized fields — an Arabic-speaking member of staff sorting by title
   * expects Arabic collation, and searching should match either language.
   * It never filters records out.
   */
  readonly locale?: Locale;
}
