import { useParams } from "react-router-dom";

import { AsyncBoundary, StateMessage } from "@/components/feedback";
import { FormError } from "@/components/form";
import { Button, PageHeader, StatusBadge } from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import { coachesAdminService } from "@/features/coaches";
import { educationAdminService } from "@/features/education";
import { sportsService } from "@/features/sports";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { PublishStatus } from "@/types";

import { BackLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { recordPath } from "../../record-paths";
import { bothLanguages } from "../coaches/form-helpers";
import { SubListBody } from "../people/sub-list";
import { SUB_LIST_PAGE_SIZE, useSubList } from "../people/use-sub-list";
import { CourseEditor } from "./course-editor";
import { EnrolmentTable } from "./enrolment-table";

/** What the course form chooses from: categories, sports and the coaches who can teach. */
async function loadCourseOptions() {
  const [categories, sports, coaches] = await Promise.all([
    educationAdminService.listCategories(),
    sportsService.list(),
    coachesAdminService.listCoaches({ pageSize: 100, sort: { field: "name", direction: "asc" } }),
  ]);
  return { categories, sports, coaches: coaches.items };
}

/**
 * The places on one course, a page at a time: `GET /v1/admin/enrolments?courseId=…`
 * with `cohortStartsOn` for the next cohort, or `excludeCohortStartsOn` for the
 * others (most recent cohort first). Moving a place refetches this page and
 * tells the course page, whose seat count it changes.
 *
 * The other cohorts' section is left out altogether while the course has none.
 */
function CoursePlaces({
  courseId,
  nextCohort,
  cohorts,
  onChanged,
}: {
  courseId: string;
  nextCohort: string;
  cohorts: "next" | "earlier";
  onChanged: () => void;
}) {
  const { t, locale } = useTranslation();
  const { date } = useFormatters();
  const { state, setPage } = useSubList(
    (page) =>
      educationAdminService.listEnrolments({
        courseId,
        page,
        pageSize: SUB_LIST_PAGE_SIZE,
        locale,
        ...(cohorts === "next"
          ? { cohortStartsOn: nextCohort }
          : { excludeCohortStartsOn: nextCohort, sort: { field: "cohortStartsOn", direction: "desc" } }),
      }),
    [courseId, nextCohort, cohorts, locale],
  );

  if (cohorts === "earlier" && !state.error && (state.data?.meta.totalItems ?? 0) === 0) return null;

  const caption = cohorts === "next" ? t("courses.nextIntake") : t("courses.earlierCohorts");
  return (
    <Section
      id={cohorts === "next" ? "cohort" : "earlier"}
      title={cohorts === "next" ? t("courses.cohortTitle", { date: date(nextCohort) }) : t("courses.earlierCohorts")}
      description={cohorts === "next" ? t("courses.cohortHint") : undefined}
      flush
    >
      <SubListBody state={state} onPageChange={setPage}>
        {(rows) => (
          <EnrolmentTable
            rows={rows}
            caption={caption}
            showCourse={false}
            onChanged={() => {
              state.refetch();
              onChanged();
            }}
          />
        )}
      </SubListBody>
    </Section>
  );
}

/** `/education/courses/new`: the course form alone. Saving opens the new course's page. */
function NewCourse() {
  const { t } = useTranslation();
  const state = useAsyncData(() => loadCourseOptions(), []);

  return (
    <RequirePermission permission="education:write">
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(options) => (
          <>
            <PageHeader title={t("crud.newNoun", { noun: t("courses.noun") })} />
            <CourseEditor course={null} {...options} />
          </>
        )}
      </AsyncBoundary>
    </RequirePermission>
  );
}

/**
 * A course, its next cohort and the people on it.
 *
 * The seat bar is the storefront's intake signal made visible: the site says
 * "open", "closing" or "full" from exactly this count, and the count is the
 * enrolments listed underneath — a paged list of their own. Cancel one and the
 * bar — and the public signal — moves.
 *
 * Status moves are their own buttons rather than a field in the form, and they
 * act on the saved course: publishing is refused until the saved title and
 * summary exist in every language.
 */
function ExistingCourse({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const { text, date, dateTime, number } = useFormatters();
  const canWrite = usePermission("education:write");

  const state = useAsyncData(async () => {
    const course = await educationAdminService.getCourse(courseId);
    if (!course) return null;
    return { course, options: await loadCourseOptions() };
  }, [courseId]);

  const publish = useAsyncAction(
    (status: PublishStatus) => educationAdminService.setCourseStatus(courseId, status),
    { onSuccess: () => state.refetch() },
  );

  return (
    <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={5}>
      {(data) => {
        if (!data) return <StateMessage tone="error" title={t("error.not-found")} />;
        const { course } = data;
        const { nextIntake } = course;
        const filled = Math.min(100, Math.round((nextIntake.seatsTaken / nextIntake.seatsTotal) * 100));
        const instructors = data.options.coaches.filter((coach) => course.instructorIds.includes(coach.id));
        const move = (status: PublishStatus, label: string, variant: "default" | "outline") => (
          <Button
            key={status}
            size="sm"
            variant={variant}
            disabled={!canWrite || publish.isPending}
            onClick={() => void publish.run(status)}
          >
            {label}
          </Button>
        );

        return (
          <>
            <PageHeader
              title={text(course.title)}
              description={text(course.summary) || t("i18n.missingIn")}
              actions={
                <>
                  <StatusBadge status={course.status} />
                  {/* A draft can be published; a published or archived course goes back to draft first. */}
                  {course.status === "draft"
                    ? move("published", t("action.publish"), "default")
                    : move("draft", t("action.unpublish"), "outline")}
                  {course.status !== "archived" ? move("archived", t("action.archive"), "outline") : null}
                </>
              }
            />
            {publish.error ? (
              <div className="*:mb-0">
                <FormError
                  error={publish.error}
                  labels={{ ...bothLanguages("title", t("field.title")), ...bothLanguages("summary", t("field.summary")) }}
                />
              </div>
            ) : null}

            {/* The cohort and the record at a glance, above the form: the
                form has its own two columns and needs the page's full width. */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Section id="intake" title={t("courses.nextIntake")} description={date(nextIntake.startsOn)}>
                <div className="flex items-baseline justify-between text-sm">
                  <span data-figure className="text-2xl font-semibold">
                    {`${number(nextIntake.seatsTaken)} / ${number(nextIntake.seatsTotal)}`}
                  </span>
                  <StatusBadge status={nextIntake.state} />
                </div>
                <div
                  role="meter"
                  aria-label={t("courses.seats")}
                  aria-valuemin={0}
                  aria-valuemax={nextIntake.seatsTotal}
                  aria-valuenow={nextIntake.seatsTaken}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${filled}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t("courses.seatsHint")}</p>
              </Section>

              <Section id="record" title={t("courses.onRecord")}>
                <Facts
                  facts={[
                    { label: t("courses.enrolled"), value: number(course.enrolmentCount) },
                    {
                      label: t("field.rating"),
                      // Live has no `rating` on the course DTO at all yet — this reads as "—" until it does.
                      value: course.rating?.count ? `${course.rating.average} (${number(course.rating.count)})` : "—",
                    },
                    { label: t("coaches.added"), value: date(course.audit.createdAt) },
                    { label: t("field.updated"), value: dateTime(course.audit.updatedAt) },
                  ]}
                />
                {instructors.length > 0 ? (
                  <>
                    <p className="mt-4 text-sm text-muted-foreground">{t("courses.instructors")}</p>
                    <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {instructors.map((coach) => (
                        <li key={coach.id}>
                          <RecordLink to={recordPath.coach(coach.id)}>{text(coach.name)}</RecordLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </Section>
            </div>

            {/* Keyed by id only: a refetch after a status or enrolment change
                must not remount the form and discard unsaved edits. */}
            <CourseEditor key={course.id} course={course} {...data.options} onSaved={state.refetch} />

            {/* Keyed by the cohort date: moving the intake starts both lists again at page one. */}
            <CoursePlaces
              key={`next-${nextIntake.startsOn}`}
              courseId={course.id}
              nextCohort={nextIntake.startsOn}
              cohorts="next"
              onChanged={state.refetch}
            />
            <CoursePlaces
              key={`earlier-${nextIntake.startsOn}`}
              courseId={course.id}
              nextCohort={nextIntake.startsOn}
              cohorts="earlier"
              onChanged={state.refetch}
            />
          </>
        );
      }}
    </AsyncBoundary>
  );
}

/** `/education/courses/:courseId`, and `/education/courses/new` for a new course. */
export function CourseDetailRoute() {
  const { courseId = "new" } = useParams();

  return (
    <RequirePermission permission="education:read">
      <BackLink to="/education/courses" />
      {courseId === "new" ? <NewCourse /> : <ExistingCourse key={courseId} courseId={courseId} />}
    </RequirePermission>
  );
}
