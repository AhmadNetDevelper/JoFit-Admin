import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, TableThumbnail, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { Button, ListCard, PageHeader, SearchInput, StatusBadge } from "@/components/ui";
import { usePermission } from "@/features/auth";
import { rentalAdminService, type RentalItem, type RentalItemSortField } from "@/features/rental";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { MediaImage, SortState } from "@/types";

import { RecordLink } from "../../components/record-parts";
import { recordPath } from "../../record-paths";
import { rentalItemPath } from "./rental-helpers";

/** The cover the storefront shows on the item's card: its first image. */
const coverOf = (item: RentalItem): MediaImage | undefined =>
  item.media?.find((entry): entry is MediaImage => entry.kind === "image");

/**
 * The hire catalogue. An item's name opens its bookings — what the depot acts
 * on day to day — and "⋯ → Edit" opens the item itself.
 */
export function RentalItemsRoute() {
  const { t } = useTranslation();
  const { text, number, date, money } = useFormatters();
  const notice = useNotice();
  const canWrite = usePermission("rental:write");
  const noun = t("rental.itemNoun");
  const [deleting, setDeleting] = useState<RentalItem | null>(null);
  const { query, setSearch, setPage, setSort } = useListQuery<RentalItemSortField>({
    defaultSort: { field: "title", direction: "asc" },
  });

  const state = useAsyncData(() => rentalAdminService.listItems(query), [query]);

  const columns: readonly DataTableColumn<RentalItem>[] = [
    {
      key: "image",
      header: t("rental.imageColumn"),
      render: (row) => <TableThumbnail image={coverOf(row)} />,
    },
    {
      key: "title",
      header: t("field.title"),
      sortField: "title",
      render: (row) => (
        <RecordLink to={recordPath.rentalItemBookings(row.id)}>{text(row.title)}</RecordLink>
      ),
    },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "location",
      header: t("field.location"),
      /* Live `AdminRentalItemDto` has no `location` at all — see RentalItem's own
         doc comment; the column reads a dash rather than throwing on an item that
         came from the HTTP adapter. */
      render: (row) => (row.location ? text(row.location.name) : "—"),
    },
    {
      key: "condition",
      header: t("rental.conditionLabel"),
      render: (row) => t(`rental.conditionValue.${row.condition}`),
    },
    {
      key: "rate",
      header: t("field.price"),
      align: "end",
      render: (row) => {
        const rate = row.rates[0];
        return rate ? `${money(rate.price)} / ${t(`rental.per.${rate.unit}`)}` : "—";
      },
    },
    {
      key: "deposit",
      header: t("field.deposit"),
      align: "end",
      render: (row) => (row.deposit ? money(row.deposit) : "—"),
    },
    {
      key: "units",
      header: t("rental.available"),
      sortField: "totalUnits",
      align: "end",
      /* What matters operationally is what can actually be hired today, so the
         serviceable count leads and the total follows it. */
      render: (row) => (
        <span data-figure>
          {`${number(row.totalUnits - row.unitsOutOfService)} / ${number(row.totalUnits)}`}
        </span>
      ),
    },
    {
      key: "updated",
      header: t("field.updated"),
      sortField: "updatedAt",
      render: (row) => date(row.audit.updatedAt),
    },
    ...(canWrite
      ? [
          {
            key: "actions",
            header: t("field.actions"),
            align: "end",
            render: (row) => (
              <RowActions
                label={text(row.title)}
                canWrite={canWrite}
                editTo={rentalItemPath(row.id)}
                onDelete={() => setDeleting(row)}
              />
            ),
          } satisfies DataTableColumn<RentalItem>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={t("rental.itemsTitle")}
        description={t("rental.itemsDescription")}
        actions={
          canWrite ? (
            <Button asChild>
              <Link to={rentalItemPath("new")}>
                <Plus /> {t("crud.addNoun", { noun })}
              </Link>
            </Button>
          ) : undefined
        }
      />
      <AsyncBoundary
        state={state}
        pendingLabel={t("state.loading")}
      >
        {(page) => (
          <ListCard
            toolbar={
              <SearchInput
                label={t("action.search")}
                value={query.search ?? ""}
                onChange={setSearch}
              />
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("rental.itemsTitle")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<RentalItemSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: text(deleting.title) }) : ""}
        onConfirm={async () => {
          if (!deleting) return;
          await rentalAdminService.deleteItem(deleting.id);
          notice.success(t("crud.deleted", { name: text(deleting.title) }));
          state.refetch();
        }}
      />
    </>
  );
}
