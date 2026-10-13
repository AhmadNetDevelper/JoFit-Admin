import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import type { SortState } from "@/types";

import { ListEmpty } from "./list-empty";
import type { DataTableColumn } from "./types";

export interface DataTableProps<TRow> {
  readonly caption: string;
  readonly columns: readonly DataTableColumn<TRow>[];
  readonly rows: readonly TRow[];
  readonly getRowKey: (row: TRow) => string;
  readonly sort?: SortState;
  readonly onSortChange?: (sort: SortState) => void;
  /** What the single row says when there are no rows. Defaults to "no results". */
  readonly emptyLabel?: string;
  /** Beside the empty message — e.g. "Clear search". */
  readonly emptyAction?: ReactNode;
}

/**
 * The one table in the admin.
 *
 * Every list screen renders through it, so accessibility is solved once: a real
 * `<table>` with a `<caption>`, `scope="col"` headers, and `aria-sort` on the
 * sorted column. Sorting is raised to the caller, which puts it in the URL and
 * sends it to the service — the table holds no state.
 *
 * It draws no border of its own: every list screen wraps it in a `ListCard`,
 * and a bordered table inside a bordered card is two lines 1px apart.
 *
 * Alignment is logical, not physical: `text-end` rather than `text-right`. A
 * column of prices aligns to the end of the reading direction, which is the
 * right edge in English and the left edge in Arabic. Physical alignment would
 * silently break every numeric column the moment the admin is switched to
 * Arabic — and it would look almost right, which is worse.
 *
 * An empty result is a row of the table, not a replacement for it. A search
 * that matches nothing must leave the search box, the filters and the column
 * headers where they are — otherwise the one control that would undo the
 * search disappears with the rows.
 */
export function DataTable<TRow>({
  caption,
  columns,
  rows,
  getRowKey,
  sort,
  onSortChange,
  emptyLabel,
  emptyAction,
}: DataTableProps<TRow>) {
  function ariaSort(column: DataTableColumn<TRow>) {
    if (!column.sortField || sort?.field !== column.sortField) return undefined;
    return sort.direction === "asc" ? ("ascending" as const) : ("descending" as const);
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const sorted = sort?.field === column.sortField;
              return (
                <TableHead
                  key={column.key}
                  aria-sort={ariaSort(column)}
                  className={column.align === "end" ? "text-end" : "text-start"}
                >
                  {column.sortField && onSortChange ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground"
                      onClick={() => {
                        const field = column.sortField as string;
                        const direction =
                          sort?.field === field && sort.direction === "asc" ? "desc" : "asc";
                        onSortChange({ field, direction });
                      }}
                    >
                      {column.header}
                      {/* The glyph states the direction; `aria-sort` on the cell
                          states it again for anything not looking at the glyph. */}
                      {sorted ? (
                        sort?.direction === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="whitespace-normal">
                <ListEmpty label={emptyLabel} action={emptyAction} />
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={column.align === "end" ? "text-end" : "text-start"}
                >
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
