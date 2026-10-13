import type { ReactNode } from "react";

/**
 * A column describes how to render and sort one field. Columns are *data*, which
 * is what keeps the table domain-agnostic: the table knows nothing about
 * products, orders or coaches.
 */
export interface DataTableColumn<TRow> {
  readonly key: string;
  readonly header: string;
  readonly render: (row: TRow) => ReactNode;
  /** The sort field sent to the service; omit for a non-sortable column. */
  readonly sortField?: string;
  /** Right-aligned for numeric columns. */
  readonly align?: "start" | "end";
}
