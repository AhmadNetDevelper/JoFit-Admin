import { useSearchParams } from "react-router-dom";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { Label, ListCard, PageHeader, SearchInput, StatusBadge, Switch } from "@/components/ui";
import {
  COACH_BOOKING_STATUSES,
  coachesAdminService,
  type CoachBooking,
  type CoachBookingSortField,
} from "@/features/coaches";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { CustomerLink, RecordLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { useStatusParam } from "../../use-status-param";
import { recordPath } from "../../record-paths";

/**
 * Coaching sessions sold through the storefront's booking step.
 *
 * The default view is what staff act on — sessions still to happen, soonest
 * first — rather than the full history, which the status chips and the
 * "upcoming" switch open back up. `?coach=` narrows to one coach, which is how
 * a coach's own page links here.
 */
export function CoachBookingsRoute() {
  const { t } = useTranslation();
  const { text, money, dateTime } = useFormatters();
  const [params] = useSearchParams();
  const coachId = params.get("coach") ?? undefined;
  const { query, flags, setSearch, setPage, setSort, setFlag } = useListQuery<CoachBookingSortField>({
    defaultSort: { field: "startsAt", direction: "asc" },
  });
  const [statuses, setStatuses] = useStatusParam(COACH_BOOKING_STATUSES);
  const showPast = flags.past ?? false;

  const state = useAsyncData(
    () =>
      coachesAdminService.listBookings({
        ...query,
        statuses,
        coachId,
        upcomingOnly: !showPast,
      }),
    [query, statuses?.join(), coachId, showPast],
  );

  const columns: readonly DataTableColumn<CoachBooking>[] = [
    {
      key: "reference",
      header: t("field.reference"),
      sortField: "reference",
      render: (row) => <RecordLink to={recordPath.coachBooking(row.id)}>{row.reference}</RecordLink>,
    },
    {
      key: "coach",
      header: t("field.coach"),
      render: (row) => <RecordLink to={recordPath.coach(row.coachId)}>{text(row.coachName)}</RecordLink>,
    },
    {
      key: "customer",
      header: t("field.customer"),
      render: (row) =>
        row.customerId ? (
          <CustomerLink id={row.customerId} name={row.contact.name} />
        ) : (
          <span dir="auto">{row.contact.name}</span>
        ),
    },
    {
      key: "package",
      header: t("field.package"),
      render: (row) => (
        <span>
          {text(row.packageName)}
          {row.mode ? <span className="text-muted-foreground">{` · ${row.mode}`}</span> : null}
        </span>
      ),
    },
    {
      key: "startsAt",
      header: t("field.startsAt"),
      sortField: "startsAt",
      render: (row) => dateTime(row.startsAt),
    },
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
  ];

  return (
    <>
      <PageHeader title={t("coachBookings.title")} description={t("coachBookings.description")} />
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
                <StatusFilter statuses={COACH_BOOKING_STATUSES} value={statuses} onChange={setStatuses} />
                <div className="flex items-center gap-2">
                  <Switch
                    id="coach-bookings-past"
                    checked={showPast}
                    onCheckedChange={(checked) => setFlag("past", checked)}
                  />
                  <Label htmlFor="coach-bookings-past" className="font-normal">
                    {t("coachBookings.includePast")}
                  </Label>
                </div>
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("coachBookings.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<CoachBookingSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </>
  );
}
