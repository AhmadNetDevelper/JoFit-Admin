import { useState } from "react";
import { useParams } from "react-router-dom";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, ErrorState, PendingState, StateMessage } from "@/components/feedback";
import { Field, FormError } from "@/components/form";
import { Badge, Button, Checkbox, Label, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  coachesAdminService,
  type AdminCoach,
  type CoachBooking,
  type CoachVerificationStatus,
} from "@/features/coaches";
import { educationAdminService } from "@/features/education";
import { reviewsAdminService } from "@/features/reviews";
import { sportsService } from "@/features/sports";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, CustomerLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { recordPath } from "../../record-paths";
import { SubListBody } from "../people/sub-list";
import { SUB_LIST_PAGE_SIZE, useSubList } from "../people/use-sub-list";
import { loadBackgroundOptions } from "./background";
import { CoachEditor } from "./coach-editor";

/** What the profile form chooses from: sports, specialisations and venues. */
async function loadProfileOptions() {
  const [sports, specialisations, locations] = await Promise.all([
    sportsService.list(),
    coachesAdminService.listSpecialisations(),
    coachesAdminService.listLocations(),
  ]);
  return { sports, specialisations, locations };
}

/**
 * A refusal must be explainable: rejecting or suspending requires a note, which
 * the service enforces. The note is not optional politeness — it is what the
 * coach is told, and what the audit trail records.
 */
function VerificationPanel({ coach, onChanged }: { coach: AdminCoach; onChanged: () => void }) {
  const { t } = useTranslation();
  const canWrite = usePermission("coaches:write");
  const [note, setNote] = useState(coach.statusNote ?? "");

  const decide = useAsyncAction(
    (status: CoachVerificationStatus) =>
      coachesAdminService.decideVerification({ coachId: coach.id, status, note }),
    { onSuccess: onChanged },
  );

  return (
    <Section id="verify" title={t("coaches.decisionTitle")} description={t("coaches.decisionHint")}>
      <Field name="note" label={t("field.note")} error={decide.fieldErrors?.note}>
        {(props) => (
          <Textarea
            {...props}
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="max-w-lg"
          />
        )}
      </Field>

      {/*
        Approving is what this screen is for; refusing and suspending are the
        same decision going the other way, and both take a coach off the public
        site. They carry the danger variant so they cannot be hit by muscle
        memory aimed at Approve.
      */}
      <div className="flex flex-wrap gap-2">
        {(["approved", "rejected", "suspended"] as const).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={status === "approved" ? "default" : "destructive"}
            disabled={!canWrite || decide.isPending || coach.verificationStatus === status}
            onClick={() => void decide.run(status)}
          >
            {status === "approved"
              ? t("action.approve")
              : status === "rejected"
                ? t("action.reject")
                : t("action.suspend")}
          </Button>
        ))}
      </div>

      <FormError error={decide.error} labels={{ note: t("field.note") }} />
    </Section>
  );
}

/* Five at a time: the page is mostly the profile form, and "View all" opens the
   full queue for this coach. */
const SESSIONS_PAGE_SIZE = 5;

/**
 * The coach's sessions, newest first: one page of `GET /v1/admin/coach-bookings?coachId=…`.
 * "View all" opens the sessions queue narrowed to this coach.
 */
function CoachSessions({ coachId }: { coachId: string }) {
  const { t, locale } = useTranslation();
  const { text, dateTime, number } = useFormatters();
  const { state, setPage } = useSubList(
    (page) =>
      coachesAdminService.listBookings({
        coachId,
        page,
        pageSize: SESSIONS_PAGE_SIZE,
        locale,
        sort: { field: "startsAt", direction: "desc" },
      }),
    [coachId, locale],
  );

  const columns: readonly DataTableColumn<CoachBooking>[] = [
    {
      key: "reference",
      header: t("field.reference"),
      render: (row) => <RecordLink to={recordPath.coachBooking(row.id)}>{row.reference}</RecordLink>,
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
    { key: "package", header: t("field.package"), render: (row) => text(row.packageName) },
    { key: "startsAt", header: t("field.startsAt"), render: (row) => dateTime(row.startsAt) },
    { key: "status", header: t("field.status"), render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <Section
      id="bookings"
      title={t("coachBookings.title")}
      description={
        state.data ? t("coachBookings.forCoach", { count: number(state.data.meta.totalItems) }) : undefined
      }
      action={<RecordLink to={`/coaches/bookings?coach=${coachId}`}>{t("action.viewAll")}</RecordLink>}
      flush
    >
      <SubListBody state={state} onPageChange={setPage}>
        {(rows) => (
          <DataTable
            caption={t("coachBookings.title")}
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            emptyLabel={t("customers.noneYet")}
          />
        )}
      </SubListBody>
    </Section>
  );
}

/**
 * The courses the coach teaches: one page of `GET /v1/admin/courses?instructorId=…`.
 * A short row of links, so the pager appears only once there is a second page.
 */
function CoachCourses({ coachId }: { coachId: string }) {
  const { t, locale } = useTranslation();
  const { text } = useFormatters();
  const { state, setPage } = useSubList(
    (page) =>
      educationAdminService.listCourses({
        instructorId: coachId,
        page,
        pageSize: SUB_LIST_PAGE_SIZE,
        locale,
        sort: { field: "title", direction: "asc" },
      }),
    [coachId, locale],
  );

  let body;
  if (state.isLoading) body = <PendingState rows={2} />;
  else if (state.error || !state.data) body = <ErrorState error={state.error} onRetry={state.refetch} />;
  else if (state.data.items.length === 0) {
    body = <p className="text-sm text-muted-foreground">{t("coaches.teachesNone")}</p>;
  } else {
    body = (
      <div aria-busy={state.isRefreshing} className={state.isRefreshing ? "opacity-60" : undefined}>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {state.data.items.map((course) => (
            <li key={course.id}>
              <RecordLink to={recordPath.course(course.id)}>{text(course.title)}</RecordLink>
            </li>
          ))}
        </ul>
        {state.data.meta.totalPages > 1 ? (
          <div className="mt-4 border-t pt-3">
            <PaginationControls meta={state.data.meta} onPageChange={setPage} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Section id="courses" title={t("coaches.teaches")}>
      {body}
    </Section>
  );
}

/**
 * `/coaches/new`: the profile form alone, plus the background only a new coach
 * has. Saving opens the new coach's page.
 */
function NewCoach() {
  const { t } = useTranslation();
  const state = useAsyncData(async () => {
    const [options, background] = await Promise.all([loadProfileOptions(), loadBackgroundOptions()]);
    return { ...options, background };
  }, []);

  return (
    <RequirePermission permission="coaches:write">
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(options) => (
          <>
            <PageHeader title={t("crud.newNoun", { noun: t("coaches.noun") })} />
            <CoachEditor coach={null} {...options} />
          </>
        )}
      </AsyncBoundary>
    </RequirePermission>
  );
}

/**
 * The coach as the public sees them, and as staff need to: the profile they
 * can correct, what the coach has earned on the platform, who has booked them,
 * what they teach, and the verification decision. Each list links to the
 * screen where that record is acted on.
 */
function ExistingCoach({ coachId }: { coachId: string }) {
  const { t } = useTranslation();
  const { date, dateTime, text, number } = useFormatters();

  /* The sessions and the courses taught are paged lists of their own, loaded beside this. */
  const state = useAsyncData(async () => {
    const coach = await coachesAdminService.getCoach(coachId);
    if (!coach) return null;
    const [reviews, options] = await Promise.all([
      reviewsAdminService.listReviews({ targetId: coachId, pageSize: 1 }),
      loadProfileOptions(),
    ]);
    return { coach, reviewCount: reviews.meta.totalItems, options };
  }, [coachId]);

  const verify = useAsyncAction(
    (input: { certificationId: string; isVerified: boolean }) =>
      coachesAdminService.setCertificationVerified(coachId, input.certificationId, input.isVerified),
    { onSuccess: () => state.refetch() },
  );

  return (
    <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={5}>
      {(data) => {
        if (!data) return <StateMessage tone="error" title={t("error.not-found")} />;
        const { coach } = data;

        return (
          <>
            <PageHeader
              title={text(coach.name)}
              description={text(coach.headline)}
              actions={
                <>
                  {coach.verificationStatus === "approved" ? (
                    <Badge variant="secondary">{t("coaches.listed")}</Badge>
                  ) : (
                    <Badge variant="outline">{t("coaches.notListed")}</Badge>
                  )}
                  <StatusBadge status={coach.verificationStatus} />
                </>
              }
            />

            <Section id="record" title={t("coaches.onPlatform")}>
              <Facts
                columns={4}
                facts={[
                  { label: t("coaches.completedSessions"), value: number(coach.completedSessions) },
                  {
                    label: t("nav.reviews"),
                    value: coach.rating.count
                      ? `${coach.rating.average} / 5 · ${number(data.reviewCount)} ${t("coaches.onFile")}`
                      : "—",
                  },
                  { label: t("coaches.added"), value: date(coach.audit.createdAt) },
                  { label: t("field.updated"), value: dateTime(coach.audit.updatedAt) },
                ]}
              />
            </Section>

            {/* Keyed by id only: a refetch after a certification or verification
                change must not remount the form and discard unsaved edits. */}
            <CoachEditor key={coach.id} coach={coach} {...data.options} onSaved={state.refetch} />

            <div className="grid gap-6 lg:grid-cols-2">
              <Section id="certs" title={t("coaches.certifications")}>
                {coach.certifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("state.empty")}</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {coach.certifications.map((certification) => (
                      <li
                        key={certification.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                      >
                        <span>
                          {[text(certification.name), text(certification.issuedBy), certification.year ?? ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`cert-${certification.id}`}
                            checked={certification.isVerified}
                            disabled={verify.isPending}
                            onCheckedChange={(checked) =>
                              void verify.run({
                                certificationId: certification.id,
                                isVerified: checked === true,
                              })
                            }
                          />
                          <Label htmlFor={`cert-${certification.id}`} className="font-normal">
                            {certification.isVerified ? t("coaches.verified") : t("coaches.unverified")}
                          </Label>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <CoachCourses coachId={coach.id} />
            </div>

            <CoachSessions coachId={coach.id} />

            <VerificationPanel coach={coach} onChanged={state.refetch} />
          </>
        );
      }}
    </AsyncBoundary>
  );
}

/** `/coaches/:coachId`, and `/coaches/new` for a coach staff add themselves. */
export function CoachDetailRoute() {
  const { coachId = "new" } = useParams();

  return (
    <RequirePermission permission="coaches:read">
      <BackLink to="/coaches" />
      {coachId === "new" ? <NewCoach /> : <ExistingCoach key={coachId} coachId={coachId} />}
    </RequirePermission>
  );
}
