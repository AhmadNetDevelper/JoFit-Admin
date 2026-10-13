import { BadgeCheck, Ban, Loader2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { Button, PageHeader } from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  careersAdminService,
  EMPLOYER_VERIFICATION_MOVES,
  type AdminEmployer,
  type AdminJob,
  type EmployerVerificationDecision,
} from "@/features/careers";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { orDash, recordPath } from "../../record-paths";
import { SubListBody } from "../people/sub-list";
import { SUB_LIST_PAGE_SIZE, useSubList } from "../people/use-sub-list";
import { useCareersLabels } from "./careers-labels";
import { ActionError, EmployerLogo, JobStatusBadge, NoteDialog, VerificationBadge, WrittenText } from "./careers-parts";

/**
 * Verify, reject, suspend, reinstate — only the moves the verification graph
 * allows from where the company is. Verifying and reinstating are one click;
 * rejecting and suspending take a note, because the company reads it and a
 * suspension takes every one of its jobs off the board at once.
 */
function VerificationPanel({ employer, onChanged }: { employer: AdminEmployer; onChanged: () => void }) {
  const { t } = useTranslation();
  const notice = useNotice();
  const canWrite = usePermission("careers:write");
  const [asking, setAsking] = useState<"rejected" | "suspended" | null>(null);
  const moves = EMPLOYER_VERIFICATION_MOVES[employer.verificationStatus];

  const verify = useAsyncAction(
    () => careersAdminService.setEmployerVerification(employer.id, { status: "verified" }),
    {
      onSuccess: () => {
        notice.success(
          t(employer.verificationStatus === "suspended" ? "careers.employer.reinstated" : "careers.employer.verified", {
            name: employer.name,
          }),
        );
        onChanged();
      },
    },
  );

  const decide = async (status: EmployerVerificationDecision, note: string) => {
    await careersAdminService.setEmployerVerification(employer.id, { status, note });
    notice.success(
      t(status === "rejected" ? "careers.employer.rejectedNotice" : "careers.employer.suspendedNotice", {
        name: employer.name,
      }),
    );
    onChanged();
  };

  return (
    <Section
      id="verification"
      title={t("careers.employer.verification")}
      description={t("careers.employer.verificationHint")}
      action={<VerificationBadge status={employer.verificationStatus} />}
    >
      <div className="flex flex-col gap-4">
        {employer.verificationNote ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-xs text-muted-foreground">{t("careers.employer.currentNote")}</p>
            <p dir="auto" className="mt-1 whitespace-pre-line">
              {employer.verificationNote}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {moves.includes("verified") ? (
            <Button size="sm" disabled={!canWrite || verify.isPending} onClick={() => void verify.run(undefined)}>
              {verify.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : employer.verificationStatus === "suspended" ? (
                <RotateCcw />
              ) : (
                <BadgeCheck />
              )}
              {employer.verificationStatus === "suspended" ? t("careers.employer.reinstate") : t("careers.employer.verify")}
            </Button>
          ) : null}
          {moves.includes("rejected") ? (
            <Button size="sm" variant="destructive" disabled={!canWrite || verify.isPending} onClick={() => setAsking("rejected")}>
              <X /> {t("action.reject")}
            </Button>
          ) : null}
          {moves.includes("suspended") ? (
            <Button size="sm" variant="destructive" disabled={!canWrite || verify.isPending} onClick={() => setAsking("suspended")}>
              <Ban /> {t("careers.employer.suspend")}
            </Button>
          ) : null}
        </div>

        <ActionError error={verify.error} />
      </div>

      <NoteDialog
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={asking === "suspended" ? t("careers.employer.suspendTitle") : t("careers.employer.rejectTitle")}
        description={asking === "suspended" ? t("careers.employer.suspendBody") : t("careers.employer.rejectBody")}
        label={t("careers.employer.noteLabel")}
        hint={t("careers.employer.noteHint")}
        confirmLabel={asking === "suspended" ? t("careers.employer.suspend") : t("action.reject")}
        onConfirm={(note) => decide(asking ?? "rejected", note)}
      />
    </Section>
  );
}

/** The company's jobs, newest first: one page of `GET /v1/admin/jobs?employerIds=…`. */
function EmployerJobs({ employer }: { employer: AdminEmployer }) {
  const { t, locale } = useTranslation();
  const { number, dateTime } = useFormatters();
  const { state, setPage } = useSubList(
    (page) =>
      careersAdminService.listJobs({
        employerIds: [employer.id],
        page,
        pageSize: SUB_LIST_PAGE_SIZE,
        locale,
        sort: { field: "updatedAt", direction: "desc" },
      }),
    [employer.id, employer.verificationStatus, locale],
  );

  const columns: readonly DataTableColumn<AdminJob>[] = [
    {
      key: "title",
      header: t("careers.jobs.job"),
      render: (row) => (
        <div>
          <RecordLink to={recordPath.job(row.id)}>
            <span dir="auto">{row.title}</span>
          </RecordLink>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.reference}
          </p>
        </div>
      ),
    },
    { key: "status", header: t("field.status"), render: (row) => <JobStatusBadge status={row.status} /> },
    {
      key: "board",
      header: t("careers.job.onBoard"),
      render: (row) => (row.isPublic ? t("state.yes") : t("state.no")),
    },
    {
      key: "applicants",
      header: t("careers.jobs.applicants"),
      align: "end",
      render: (row) => <span data-figure>{number(row.applicationCount)}</span>,
    },
    { key: "changed", header: t("careers.jobs.changed"), render: (row) => dateTime(row.updatedAt) },
  ];

  return (
    <Section
      id="jobs"
      title={t("careers.employers.jobs")}
      description={
        state.data ? t("careers.employer.jobsCount", { count: number(state.data.meta.totalItems) }) : undefined
      }
      action={<RecordLink to={`/careers/jobs?status=all&employer=${employer.id}`}>{t("action.viewAll")}</RecordLink>}
      flush
    >
      <SubListBody state={state} onPageChange={setPage}>
        {(rows) => (
          <DataTable
            caption={t("careers.employers.jobs")}
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            emptyLabel={t("careers.employer.noJobs")}
          />
        )}
      </SubListBody>
    </Section>
  );
}

function ExistingEmployer({ employerId }: { employerId: string }) {
  const { t } = useTranslation();
  const { date, dateTime, number } = useFormatters();
  const labels = useCareersLabels();
  const state = useAsyncData(() => careersAdminService.getEmployer(employerId), [employerId]);

  return (
    <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={5}>
      {(employer) => {
        if (!employer) return <StateMessage tone="error" title={t("error.not-found")} />;
        return (
          <>
            <PageHeader
              title={<span dir="auto">{employer.name}</span>}
              description={`${labels.kind(employer.kind)} · ${labels.city(employer.cityId)}`}
              actions={
                <>
                  <span className="text-sm text-muted-foreground">
                    {t("careers.employer.onBoard", { count: number(employer.openJobCount) })}
                    {employer.pendingJobCount > 0
                      ? ` · ${t("careers.employer.waiting", { count: number(employer.pendingJobCount) })}`
                      : ""}
                  </span>
                  <VerificationBadge status={employer.verificationStatus} />
                </>
              }
            />

            <div className="grid items-start gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Section id="profile" title={t("careers.employer.profile")} description={t("careers.employer.profileHint")}>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                      <EmployerLogo logo={employer.logo} large />
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-2 text-sm font-medium">{t("careers.employer.about")}</h3>
                        <WrittenText empty={t("careers.employer.noAbout")}>{employer.about}</WrittenText>
                      </div>
                    </div>
                    <Facts
                      columns={3}
                      facts={[
                        { label: t("careers.employer.contact"), value: <span dir="auto">{employer.contactName}</span> },
                        {
                          label: t("field.email"),
                          value: (
                            <a href={`mailto:${employer.email}`} dir="ltr" className="underline-offset-4 hover:underline">
                              {employer.email}
                            </a>
                          ),
                        },
                        /* `loginEmail` is the account's sign-in address; the live API
                           keeps it separate from the public contact `email` above
                           (see AdminEmployer.loginEmail). Shown only when it actually
                           differs, so the common case (they match) doesn't repeat a row. */
                        ...(employer.loginEmail && employer.loginEmail !== employer.email
                          ? [
                              {
                                label: t("careers.employer.loginEmail"),
                                value: (
                                  <span dir="ltr" className="truncate">
                                    {employer.loginEmail}
                                  </span>
                                ),
                              },
                            ]
                          : []),
                        { label: t("field.phone"), value: orDash(employer.phone ? <span dir="ltr">{employer.phone}</span> : undefined) },
                        {
                          label: t("careers.employer.website"),
                          value: orDash(
                            employer.website ? (
                              <a
                                href={employer.website}
                                target="_blank"
                                rel="noreferrer noopener"
                                dir="ltr"
                                className="underline-offset-4 hover:underline"
                              >
                                {employer.website.replace(/^https?:\/\//, "")}
                              </a>
                            ) : undefined,
                          ),
                        },
                        { label: t("careers.employer.size"), value: orDash(employer.size ? labels.size(employer.size) : undefined) },
                        { label: t("careers.employers.kind"), value: labels.kind(employer.kind) },
                        { label: t("field.city"), value: labels.city(employer.cityId) },
                        { label: t("careers.employers.registered"), value: date(employer.createdAt) },
                        { label: t("field.updated"), value: dateTime(employer.updatedAt) },
                      ]}
                    />
                  </div>
                </Section>
              </div>
              <VerificationPanel employer={employer} onChanged={state.refetch} />
            </div>

            <EmployerJobs employer={employer} />
          </>
        );
      }}
    </AsyncBoundary>
  );
}

/** `/careers/employers/:employerId` — where an `employer-registered` notification lands. */
export function EmployerDetailRoute() {
  const { employerId = "" } = useParams();
  return (
    <RequirePermission permission="careers:read">
      <BackLink to="/careers/employers" />
      <ExistingEmployer key={employerId} employerId={employerId} />
    </RequirePermission>
  );
}
