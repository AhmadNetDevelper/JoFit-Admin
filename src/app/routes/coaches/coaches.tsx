import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, TableThumbnail, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { Button, ListCard, PageHeader, SearchInput, StatusBadge } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  COACH_VERIFICATION_STATUSES,
  coachesAdminService,
  type AdminCoach,
  type CoachSortField,
} from "@/features/coaches";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { RecordLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { recordPath } from "../../record-paths";
import { useStatusParam } from "../../use-status-param";

export function CoachesRoute() {
  const { t } = useTranslation();
  const { number, date, text, money } = useFormatters();
  const notice = useNotice();
  const canWrite = usePermission("coaches:write");
  const { query, setSearch, setPage, setSort } = useListQuery<CoachSortField>({
    defaultSort: { field: "verificationStatus", direction: "desc" },
  });
  const [statuses, setStatuses] = useStatusParam(COACH_VERIFICATION_STATUSES);
  const [deleting, setDeleting] = useState<AdminCoach | null>(null);

  const state = useAsyncData(
    () => coachesAdminService.listCoaches({ ...query, statuses }),
    [query, statuses?.join()],
  );

  const columns: readonly DataTableColumn<AdminCoach>[] = [
    { key: "photo", header: t("coaches.photo"), render: (row) => <TableThumbnail image={row.avatar} /> },
    {
      key: "name",
      header: t("field.name"),
      sortField: "name",
      render: (row) => <RecordLink to={recordPath.coach(row.id)}>{text(row.name)}</RecordLink>,
    },
    {
      key: "location",
      header: t("field.location"),
      /* The live API names the venue but not its city. */
      render: (row) => text(row.location.city) || text(row.location.name),
    },
    {
      key: "status",
      header: t("field.verification"),
      sortField: "verificationStatus",
      render: (row) => <StatusBadge status={row.verificationStatus} />,
    },
    {
      key: "from",
      header: t("coaches.from"),
      align: "end",
      render: (row) => {
        const cheapest = [...row.packages].sort((a, b) => a.price.amount - b.price.amount)[0];
        return cheapest ? money(cheapest.price) : "—";
      },
    },
    {
      key: "sessions",
      header: t("coaches.completedSessions"),
      align: "end",
      render: (row) => number(row.completedSessions),
    },
    {
      key: "rating",
      header: t("field.rating"),
      sortField: "rating",
      align: "end",
      render: (row) =>
        row.rating.count === 0 ? "—" : `${row.rating.average} (${number(row.rating.count)})`,
    },
    {
      key: "updated",
      header: t("field.updated"),
      sortField: "updatedAt",
      render: (row) => date(row.audit.updatedAt),
    },
    {
      key: "actions",
      header: t("field.actions"),
      align: "end",
      render: (row) => (
        <RowActions
          label={text(row.name)}
          canWrite={canWrite}
          editTo={recordPath.coach(row.id)}
          onDelete={() => setDeleting(row)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("coaches.title")}
        description={t("coaches.description")}
        actions={
          canWrite ? (
            <Button asChild>
              <Link to="/coaches/new">
                <Plus /> {t("crud.addNoun", { noun: t("coaches.noun") })}
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
              <>
                <SearchInput
                  label={t("action.search")}
                  value={query.search ?? ""}
                  onChange={setSearch}
                />
                <StatusFilter
                  statuses={COACH_VERIFICATION_STATUSES}
                  value={statuses}
                  onChange={setStatuses}
                />
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("coaches.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<CoachSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>

      {/* A refusal — sessions still to deliver, a course still taught — is shown
          in the dialog itself, beside the button that caused it. */}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: text(deleting.name) }) : ""}
        description={t("coaches.deleteBody")}
        onConfirm={async () => {
          if (!deleting) return;
          await coachesAdminService.deleteCoach(deleting.id);
          notice.success(t("crud.deleted", { name: text(deleting.name) }));
          state.refetch();
        }}
      />
    </>
  );
}
