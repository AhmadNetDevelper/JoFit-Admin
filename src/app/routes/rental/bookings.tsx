import { useSearchParams } from "react-router-dom";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { FormError } from "@/components/form";
import { Button, ListCard, PageHeader, SearchInput, StatusBadge } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  RENTAL_BOOKING_STATUSES,
  allowedBookingTransitions,
  rentalAdminService,
  type RentalBooking,
  type RentalBookingSortField,
  type RentalBookingStatus,
} from "@/features/rental";
import { useAsyncAction, useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { CustomerLink, RecordLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { useStatusParam } from "../../use-status-param";
import { recordPath } from "../../record-paths";

/**
 * The depot's worklist. Every booking came from an order line, so the order it
 * was paid through is one click away, and so is the customer.
 *
 * `?item=` narrows to one hire item — how a rental item's name links here, and
 * how a review of a hire item finds the bookings behind it.
 */
export function BookingsRoute() {
  const { t } = useTranslation();
  const { text, money, date, number } = useFormatters();
  const canWrite = usePermission("rental:write");
  const [params] = useSearchParams();
  const itemId = params.get("item") ?? undefined;
  const { query, setSearch, setPage, setSort } = useListQuery<RentalBookingSortField>({
    defaultSort: { field: "from", direction: "desc" },
  });
  const [statuses, setStatuses] = useStatusParam(RENTAL_BOOKING_STATUSES);

  const state = useAsyncData(
    () => rentalAdminService.listBookings({ ...query, statuses, itemId }),
    [query, statuses?.join(), itemId],
  );

  const change = useAsyncAction(
    (input: { id: string; status: RentalBookingStatus }) =>
      rentalAdminService.setBookingStatus(input.id, input.status),
    { onSuccess: () => state.refetch() },
  );

  const release = useAsyncAction((id: string) => rentalAdminService.releaseDeposit(id), {
    onSuccess: () => state.refetch(),
  });

  const columns: readonly DataTableColumn<RentalBooking>[] = [
    {
      key: "reference",
      header: t("field.reference"),
      sortField: "reference",
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.reference}</span>
          <RecordLink to={recordPath.order(row.orderId)}>
            {/* Live `AdminRentalBookingDto` has no `orderReference` at all — fall back to the id. */}
            <span className="text-xs text-muted-foreground">{row.orderReference ?? row.orderId}</span>
          </RecordLink>
        </span>
      ),
    },
    { key: "item", header: t("field.title"), render: (row) => text(row.itemTitle) },
    {
      key: "customer",
      header: t("field.customer"),
      render: (row) => <CustomerLink id={row.customerId} name={row.customerName} />,
    },
    {
      key: "period",
      header: t("field.period"),
      sortField: "from",
      render: (row) =>
        row.period.from === row.period.to
          ? date(row.period.from)
          : `${date(row.period.from)} – ${date(row.period.to)}`,
    },
    { key: "units", header: t("field.units"), align: "end", render: (row) => number(row.quantity) },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "total",
      header: t("field.total"),
      sortField: "total",
      align: "end",
      render: (row) => money(row.total),
    },
    {
      key: "actions",
      header: t("field.actions"),
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {allowedBookingTransitions(row.status).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === "cancelled" ? "destructive" : "outline"}
              disabled={!canWrite || change.isPending}
              onClick={() => void change.run({ id: row.id, status })}
            >
              {t(`statusLabel.${status}`)}
            </Button>
          ))}
          {row.deposit && row.status === "returned" && !row.depositReleasedAt && !row.depositReleased ? (
            <Button
              size="sm"
              variant="default"
              disabled={!canWrite || release.isPending}
              onClick={() => void release.run(row.id)}
            >
              {`${t("action.releaseDeposit")} · ${money(row.deposit)}`}
            </Button>
          ) : null}
          {row.depositReleasedAt || row.depositReleased ? (
            <span className="text-xs text-muted-foreground">{t("rental.depositReleased")}</span>
          ) : null}
        </span>
      ),
    },
  ];

  const actionError = change.error ?? release.error;

  return (
    <>
      <PageHeader title={t("rental.bookingsTitle")} description={t("rental.bookingsDescription")} />

      {/*
        The only place a `FormError` is a top-level block rather than part of a
        form. `ErrorSummary` carries `mb-4` so that inside a form it clears the
        first field; here the shell's column already spaces it, and the margin
        would stack into an asymmetric gap. The wrapper is conditional because an
        empty one would still claim a slot in that column.
      */}
      {actionError ? (
        <div className="*:mb-0">
          <FormError error={actionError} />
        </div>
      ) : null}
      <AsyncBoundary
        state={state}
        pendingLabel={t("state.loading")}
      >
        {(page) => (
          <ListCard
            toolbar={
              <>
                <SearchInput
                  label={t("action.search")}
                  value={query.search ?? ""}
                  onChange={setSearch}
                />
                <StatusFilter statuses={RENTAL_BOOKING_STATUSES} value={statuses} onChange={setStatuses} />
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("rental.bookingsTitle")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<RentalBookingSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </>
  );
}
