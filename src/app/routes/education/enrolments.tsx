import { useSearchParams } from "react-router-dom";

import { PaginationControls } from "@/components/data-table";
import { AsyncBoundary } from "@/components/feedback";
import { ListCard, PageHeader, SearchInput } from "@/components/ui";
import {
  ENROLMENT_STATUSES,
  educationAdminService,
  type EnrolmentSortField,
} from "@/features/education";
import { useAsyncData, useListQuery } from "@/hooks";
import { useTranslation } from "@/i18n";

import { StatusFilter } from "../../components/status-filter";
import { useStatusParam } from "../../use-status-param";
import { EnrolmentTable } from "./enrolment-table";

/**
 * Course places across the academy. Opens on the seats that need a decision —
 * pending payment — because that is the queue; the chips open up the rest.
 */
export function EnrolmentsRoute() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const courseId = params.get("course") ?? undefined;
  const { query, setSearch, setPage } = useListQuery<EnrolmentSortField>({
    defaultSort: { field: "enrolledAt", direction: "desc" },
  });
  const [statuses, setStatuses] = useStatusParam(ENROLMENT_STATUSES);

  const state = useAsyncData(
    () => educationAdminService.listEnrolments({ ...query, statuses, courseId }),
    [query, statuses?.join(), courseId],
  );

  return (
    <>
      <PageHeader title={t("enrolments.title")} description={t("enrolments.description")} />
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
                <StatusFilter statuses={ENROLMENT_STATUSES} value={statuses} onChange={setStatuses} />
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <EnrolmentTable
              rows={page.items}
              caption={t("enrolments.title")}
              showCourse
              onChanged={state.refetch}
            />
          </ListCard>
        )}
      </AsyncBoundary>
    </>
  );
}
