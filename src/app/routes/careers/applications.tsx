import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { ListCard, NativeSelect, NativeSelectOption, PageHeader, SearchInput } from "@/components/ui";
import { RequirePermission } from "@/features/auth";
import {
  APPLICATION_STATUSES,
  careersAdminService,
  type AdminJobApplication,
  type ApplicationSortField,
} from "@/features/careers";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { CustomerLink, RecordLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { recordPath } from "../../record-paths";
import { useStatusParam } from "../../use-status-param";
import { useCareersLabels, useFilterParams } from "./careers-labels";
import { ApplicationStatusBadge } from "./careers-parts";

/* A job picker is at most one page of jobs: narrowed to the employer chosen, it is always short. */
const JOB_PICKER_SIZE = 100;

/**
 * Careers → Applications: every application candidates sent, READ-ONLY.
 * Moving one is the employer's decision; staff find it, read it and open the
 * CV. `?employer=` and `?job=` narrow it — a job's page links here with both —
 * and the search matches the candidate's name, email or phone, the reference,
 * the job or the employer.
 */
export function ApplicationsRoute() {
  const { t } = useTranslation();
  const { dateTime } = useFormatters();
  const labels = useCareersLabels();
  const { query, setSearch, setPage, setSort } = useListQuery<ApplicationSortField>({
    defaultSort: { field: "submittedAt", direction: "desc" },
  });
  const [statuses, setStatuses] = useStatusParam(APPLICATION_STATUSES);
  const [filters, setFilters] = useFilterParams(["employer", "job", "customer"] as const);

  const employers = useAsyncData(() => careersAdminService.listEmployerOptions(), []);
  const jobs = useAsyncData(
    () =>
      careersAdminService.listJobs({
        employerIds: filters.employer ? [filters.employer] : undefined,
        pageSize: JOB_PICKER_SIZE,
        sort: { field: "title", direction: "asc" },
      }),
    [filters.employer],
  );

  const state = useAsyncData(
    () =>
      careersAdminService.listApplications({
        ...query,
        statuses,
        employerIds: filters.employer ? [filters.employer] : undefined,
        jobIds: filters.job ? [filters.job] : undefined,
        customerId: filters.customer,
      }),
    [query, statuses?.join(), filters.employer, filters.job, filters.customer],
  );

  const columns: readonly DataTableColumn<AdminJobApplication>[] = [
    {
      key: "reference",
      header: t("field.reference"),
      sortField: "reference",
      render: (row) => (
        <RecordLink to={recordPath.jobApplication(row.id)}>
          <span dir="ltr">{row.reference}</span>
        </RecordLink>
      ),
    },
    {
      key: "candidate",
      header: t("careers.applications.candidate"),
      render: (row) => (
        <div>
          <CustomerLink id={row.customerId} name={row.candidate.name} />
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.candidate.email}
          </p>
        </div>
      ),
    },
    {
      key: "job",
      header: t("careers.applications.job"),
      render: (row) => (
        <RecordLink to={recordPath.job(row.job.id)}>
          <span dir="auto">{row.job.title}</span>
        </RecordLink>
      ),
    },
    {
      key: "employer",
      header: t("careers.employer"),
      render: (row) => (
        <RecordLink to={recordPath.employer(row.employer.id)}>
          <span dir="auto">{row.employer.name}</span>
        </RecordLink>
      ),
    },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (row) => <ApplicationStatusBadge status={row.status} />,
    },
    {
      key: "submitted",
      header: t("field.submitted"),
      sortField: "submittedAt",
      render: (row) => dateTime(row.submittedAt),
    },
  ];

  return (
    <RequirePermission permission="careers:read">
      <PageHeader title={t("careers.applications.title")} description={t("careers.applications.description")} />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(page) => (
          <ListCard
            toolbar={
              <>
                <SearchInput label={t("careers.applications.search")} value={query.search ?? ""} onChange={setSearch} />
                <NativeSelect
                  aria-label={t("careers.employer")}
                  wrapperClassName="w-52"
                  value={filters.employer ?? ""}
                  /* A new employer's jobs are a different list: the job chosen from the last one goes. */
                  onChange={(event) => setFilters({ employer: event.target.value || undefined, job: undefined })}
                >
                  <NativeSelectOption value="">{t("careers.allEmployers")}</NativeSelectOption>
                  {(employers.data ?? []).map((employer) => (
                    <NativeSelectOption key={employer.id} value={employer.id}>
                      {employer.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  aria-label={t("careers.applications.job")}
                  wrapperClassName="w-60"
                  value={filters.job ?? ""}
                  onChange={(event) => setFilters({ job: event.target.value || undefined })}
                >
                  <NativeSelectOption value="">{t("careers.applications.allJobs")}</NativeSelectOption>
                  {(jobs.data?.items ?? []).map((job) => (
                    <NativeSelectOption key={job.id} value={job.id}>
                      {`${job.reference} · ${job.title}`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <StatusFilter
                  statuses={APPLICATION_STATUSES}
                  value={statuses}
                  onChange={setStatuses}
                  labelOf={labels.appStatus}
                />
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("careers.applications.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<ApplicationSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </RequirePermission>
  );
}
