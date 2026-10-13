import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { ListCard, PageHeader, SearchInput } from "@/components/ui";
import { RequirePermission } from "@/features/auth";
import {
  careersAdminService,
  EMPLOYER_VERIFICATION_STATUSES,
  type AdminEmployer,
  type EmployerSortField,
} from "@/features/careers";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { RecordLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { recordPath } from "../../record-paths";
import { useStatusParam } from "../../use-status-param";
import { useCareersLabels } from "./careers-labels";
import { EmployerLogo, VerificationBadge } from "./careers-parts";

/**
 * Careers → Employers. Every company that opened an employer account, the
 * ones waiting to be verified first. The chips narrow by verification; the
 * search matches the name, the contact, the email, the phone, or the city in
 * either language. Company names are the company's own and set `dir="auto"`.
 */
export function EmployersRoute() {
  const { t } = useTranslation();
  const { number, date } = useFormatters();
  const labels = useCareersLabels();
  const { query, setSearch, setPage, setSort } = useListQuery<EmployerSortField>();
  const [statuses, setStatuses] = useStatusParam(EMPLOYER_VERIFICATION_STATUSES);

  const state = useAsyncData(
    () => careersAdminService.listEmployers({ ...query, verificationStatuses: statuses }),
    [query, statuses?.join()],
  );

  const columns: readonly DataTableColumn<AdminEmployer>[] = [
    { key: "logo", header: t("careers.logo"), render: (row) => <EmployerLogo logo={row.logo} /> },
    {
      key: "name",
      header: t("careers.employers.company"),
      sortField: "name",
      render: (row) => (
        <div className="min-w-44">
          <RecordLink to={recordPath.employer(row.id)}>
            <span dir="auto">{row.name}</span>
          </RecordLink>
          <p className="text-xs text-muted-foreground">
            <span dir="auto">{row.contactName}</span>
          </p>
        </div>
      ),
    },
    { key: "kind", header: t("careers.employers.kind"), render: (row) => labels.kind(row.kind) },
    { key: "city", header: t("field.city"), render: (row) => labels.city(row.cityId) },
    {
      key: "status",
      header: t("field.verification"),
      sortField: "verificationStatus",
      render: (row) => <VerificationBadge status={row.verificationStatus} />,
    },
    {
      key: "jobs",
      header: t("careers.employers.jobs"),
      align: "end",
      render: (row) => (
        <span data-figure>
          {t("careers.employers.jobsSummary", { total: number(row.jobCount), open: number(row.openJobCount) })}
        </span>
      ),
    },
    {
      key: "registered",
      header: t("careers.employers.registered"),
      sortField: "createdAt",
      render: (row) => date(row.createdAt),
    },
  ];

  return (
    <RequirePermission permission="careers:read">
      <PageHeader title={t("careers.employers.title")} description={t("careers.employers.description")} />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(page) => (
          <ListCard
            toolbar={
              <>
                <SearchInput label={t("action.search")} value={query.search ?? ""} onChange={setSearch} />
                <StatusFilter
                  statuses={EMPLOYER_VERIFICATION_STATUSES}
                  value={statuses}
                  onChange={setStatuses}
                  labelOf={labels.verification}
                />
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("careers.employers.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<EmployerSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </RequirePermission>
  );
}
