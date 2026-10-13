import { Star } from "lucide-react";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { ListCard, NativeSelect, NativeSelectOption, PageHeader, SearchInput } from "@/components/ui";
import { RequirePermission } from "@/features/auth";
import { careersAdminService, JOB_STATUSES, type AdminJob, type JobSortField } from "@/features/careers";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { RecordLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { recordPath } from "../../record-paths";
import { useCareersLabels, useFilterParams, useJobStatusParam } from "./careers-labels";
import { EmployerLogo, JobStatusBadge } from "./careers-parts";

/**
 * Careers → Jobs: the moderation queue.
 *
 * It opens on "Waiting for review" — the work — and every other status is a
 * chip away. The employer and category filters narrow it; the search matches
 * a title, a reference, the employer, or a category or city in either
 * language. Titles are the employer's own words, in whichever language they
 * wrote them, so each is set `dir="auto"`.
 */
export function JobsRoute() {
  const { t } = useTranslation();
  const { number, dateTime, text } = useFormatters();
  const labels = useCareersLabels();
  const { query, setSearch, setPage, setSort } = useListQuery<JobSortField>({
    defaultSort: { field: "updatedAt", direction: "desc" },
  });
  const [statuses, setStatuses] = useJobStatusParam();
  const [filters, setFilters] = useFilterParams(["employer", "category"] as const);

  const options = useAsyncData(
    async () => {
      const [employers, categories] = await Promise.all([
        careersAdminService.listEmployerOptions(),
        careersAdminService.listCategories(),
      ]);
      return { employers, categories };
    },
    [],
  );

  const state = useAsyncData(
    () =>
      careersAdminService.listJobs({
        ...query,
        statuses,
        employerIds: filters.employer ? [filters.employer] : undefined,
        categoryIds: filters.category ? [filters.category] : undefined,
      }),
    [query, statuses?.join(), filters.employer, filters.category],
  );

  const columns: readonly DataTableColumn<AdminJob>[] = [
    { key: "logo", header: t("careers.logo"), render: (row) => <EmployerLogo logo={row.employer.logo} /> },
    {
      key: "title",
      header: t("careers.jobs.job"),
      sortField: "title",
      render: (row) => (
        <div className="min-w-48">
          <RecordLink to={recordPath.job(row.id)}>
            <span dir="auto">{row.title}</span>
          </RecordLink>
          <p className="text-xs text-muted-foreground">
            <span dir="ltr">{row.reference}</span>
            {` · ${text(row.category.name)} · ${labels.city(row.cityId)}`}
          </p>
        </div>
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
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <JobStatusBadge status={row.status} />
          {row.featured ? (
            <Star className="size-3.5 fill-current text-amber-500" aria-label={t("careers.jobs.featured")} />
          ) : null}
        </span>
      ),
    },
    {
      key: "applicants",
      header: t("careers.jobs.applicants"),
      sortField: "applicationCount",
      align: "end",
      render: (row) => <span data-figure>{number(row.applicationCount)}</span>,
    },
    {
      key: "changed",
      header: t("careers.jobs.changed"),
      sortField: "updatedAt",
      render: (row) => dateTime(row.updatedAt),
    },
  ];

  return (
    <RequirePermission permission="careers:read">
      <PageHeader title={t("careers.jobs.title")} description={t("careers.jobs.description")} />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(page) => (
          <ListCard
            toolbar={
              <>
                <SearchInput label={t("action.search")} value={query.search ?? ""} onChange={setSearch} />
                <StatusFilter statuses={JOB_STATUSES} value={statuses} onChange={setStatuses} labelOf={labels.jobStatus} />
                <NativeSelect
                  aria-label={t("careers.employer")}
                  wrapperClassName="w-52"
                  value={filters.employer ?? ""}
                  onChange={(event) => setFilters({ employer: event.target.value || undefined })}
                >
                  <NativeSelectOption value="">{t("careers.allEmployers")}</NativeSelectOption>
                  {(options.data?.employers ?? []).map((employer) => (
                    <NativeSelectOption key={employer.id} value={employer.id}>
                      {employer.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  aria-label={t("careers.category")}
                  wrapperClassName="w-52"
                  value={filters.category ?? ""}
                  onChange={(event) => setFilters({ category: event.target.value || undefined })}
                >
                  <NativeSelectOption value="">{t("careers.allCategories")}</NativeSelectOption>
                  {(options.data?.categories ?? []).map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {text(category.name)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("careers.jobs.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<JobSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </RequirePermission>
  );
}
