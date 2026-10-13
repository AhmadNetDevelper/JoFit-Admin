import { useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { Label, ListCard, PageHeader, SearchInput, StatusBadge, Switch } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  quotationsAdminService,
  type QuotationRequest,
  type QuotationSortField,
} from "@/features/quotations";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

export function QuotationsRoute() {
  const { t } = useTranslation();
  const { dateTime } = useFormatters();
  const notice = useNotice();
  const canWrite = usePermission("quotations:write");
  const [deleting, setDeleting] = useState<QuotationRequest | null>(null);
  const { query, flags, setSearch, setPage, setSort, setFlag } = useListQuery<QuotationSortField>({
    defaultSort: { field: "submittedAt", direction: "desc" },
  });

  const unassignedOnly = flags.unassigned ?? false;
  const state = useAsyncData(
    () => quotationsAdminService.listRequests({ ...query, unassignedOnly }),
    [query, unassignedOnly],
  );

  const columns: readonly DataTableColumn<QuotationRequest>[] = [
    {
      key: "reference",
      header: t("field.reference"),
      sortField: "reference",
      render: (row) => <Link to={`/quotations/${row.id}`}>{row.reference}</Link>,
    },
    {
      key: "organisation",
      header: t("field.organisation"),
      sortField: "organisationName",
      render: (row) => row.organisationName,
    },
    { key: "subject", header: t("field.description"), render: (row) => row.subjectKind },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "assignee",
      header: t("field.assignee"),
      render: (row) => row.assigneeName ?? row.assigneeId ?? "—",
    },
    {
      key: "submitted",
      header: t("field.submitted"),
      sortField: "submittedAt",
      render: (row) => dateTime(row.submittedAt),
    },
    {
      key: "actions",
      header: t("field.actions"),
      align: "end",
      render: (row) => (
        <RowActions label={row.reference} canWrite={canWrite} onDelete={() => setDeleting(row)} />
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t("quotations.title")} description={t("quotations.description")} />

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
                <div className="flex items-center gap-2">
                  <Switch
                    id="quotations-unassigned-only"
                    checked={unassignedOnly}
                    onCheckedChange={(checked) => setFlag("unassigned", checked)}
                  />
                  <Label htmlFor="quotations-unassigned-only" className="font-normal">
                    {t("quotations.unassignedOnly")}
                  </Label>
                </div>
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("quotations.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<QuotationSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: deleting.reference }) : ""}
        description={t("quotations.deleteBody")}
        onConfirm={async () => {
          if (!deleting) return;
          await quotationsAdminService.deleteRequest(deleting.id);
          notice.success(t("crud.deleted", { name: deleting.reference }));
          state.refetch();
        }}
      />
    </>
  );
}
