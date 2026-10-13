import { Check, Loader2, Lock, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { Badge, Button, Label, PageHeader, Switch } from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import { careersAdminService, type AdminEmployer, type AdminJob } from "@/features/careers";
import { sportsService, type Sport } from "@/features/sports";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import { AppError, isAppError } from "@/lib";

import { BackLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { recordPath } from "../../record-paths";
import { useCareersLabels } from "./careers-labels";
import { ActionError, EmployerLogo, JobStatusBadge, NoteDialog, VerificationBadge, WrittenText } from "./careers-parts";

/** A list the employer wrote — requirements, benefits — one line each, as written. */
function WrittenList({ items }: { items: readonly string[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t("careers.job.noneListed")}</p>;
  return (
    /* The list takes its direction once, from what the employer wrote, so the bullets stay on one side. */
    <ul dir="auto" className="list-disc space-y-1 ps-5 text-sm">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * The job whole, as the careers board will show it: the facts a candidate
 * filters by, in the reader's language, and everything the employer wrote,
 * exactly as they wrote it.
 */
function JobPreview({ job, sports }: { job: AdminJob; sports: readonly Sport[] }) {
  const { t } = useTranslation();
  const { date, number, text, list } = useFormatters();
  const labels = useCareersLabels();

  const salary =
    job.salary && !job.showSalary
      ? `${labels.salary(job.salary)} · ${t("careers.job.salaryHidden")}`
      : labels.salary(job.salary);

  return (
    <Section id="preview" title={t("careers.job.preview")} description={t("careers.job.previewHint")}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <EmployerLogo logo={job.employer.logo} large />
          <div className="min-w-0">
            <h2 className="text-lg leading-snug font-semibold">
              <span dir="auto">{job.title}</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              <span dir="auto">{job.employer.name}</span>
              {` · ${labels.city(job.cityId)}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{text(job.category.name)}</Badge>
              <Badge variant="outline">{labels.employmentType(job.employmentType)}</Badge>
              <Badge variant="outline">{labels.workMode(job.workMode)}</Badge>
              <Badge variant="outline">{labels.level(job.experienceLevel)}</Badge>
            </div>
          </div>
        </div>

        <Facts
          columns={3}
          facts={[
            { label: t("careers.job.salary"), value: salary },
            {
              label: t("careers.job.closesOn"),
              value: job.closesOn ? date(job.closesOn) : t("careers.job.openUntilClosed"),
            },
            { label: t("careers.job.positions"), value: number(job.positions) },
            { label: t("careers.job.languages"), value: list(job.languages.map(labels.language)) },
            {
              label: t("careers.job.sports"),
              value: sports.length > 0 ? list(sports.map((sport) => text(sport.name))) : "—",
            },
            { label: t("careers.job.city"), value: labels.city(job.cityId) },
          ]}
        />

        <div>
          <h3 className="mb-2 text-sm font-medium">{t("careers.job.about")}</h3>
          <WrittenText empty={t("careers.job.noneListed")}>{job.description}</WrittenText>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("careers.job.requirements")}</h3>
            <WrittenList items={job.requirements} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">{t("careers.job.benefits")}</h3>
            <WrittenList items={job.benefits} />
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * What staff decide. Approve is offered only when the graph allows it, and
 * disabled — with the reason beside it — while the employer is unverified:
 * a job from an unverified employer is never public, so approving it would
 * publish nothing. Rejecting always takes a note, because the employer reads
 * it. Every refusal from the service is shown here, where it happened.
 */
function ReviewPanel({ job, onChanged }: { job: AdminJob; onChanged: () => void }) {
  const { t } = useTranslation();
  const { number } = useFormatters();
  const labels = useCareersLabels();
  const notice = useNotice();
  const navigate = useNavigate();
  const canWrite = usePermission("careers:write");
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const approve = useAsyncAction(() => careersAdminService.moderateJob(job.id, { decision: "approve" }), {
    onSuccess: () => {
      notice.success(t("careers.job.approved", { reference: job.reference }));
      onChanged();
    },
  });
  const close = useAsyncAction(() => careersAdminService.closeJob(job.id), {
    onSuccess: () => {
      notice.success(t("careers.job.closed", { reference: job.reference }));
      onChanged();
    },
  });
  const feature = useAsyncAction((featured: boolean) => careersAdminService.setJobFeatured(job.id, featured), {
    onSuccess: (updated) => {
      notice.success(t(updated.featured ? "careers.job.featuredOn" : "careers.job.featuredOff", { reference: job.reference }));
      onChanged();
    },
  });

  const verified = job.employer.verificationStatus === "verified";
  const busy = approve.isPending || close.isPending || feature.isPending;

  return (
    <Section id="review" title={t("careers.job.review")} description={t("careers.job.reviewHint")}>
      <div className="flex flex-col gap-4">
        {job.status === "pending" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!canWrite || !verified || busy} onClick={() => void approve.run(undefined)}>
                {approve.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check />}
                {t("careers.job.approve")}
              </Button>
              <Button size="sm" variant="destructive" disabled={!canWrite || busy} onClick={() => setRejecting(true)}>
                <X /> {t("action.reject")}
              </Button>
            </div>
            {!verified ? (
              <p id="approve-blocked" className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {t("careers.job.approveBlocked", { employer: job.employer.name })}{" "}
                  <RecordLink to={recordPath.employer(job.employer.id)}>{t("careers.job.openEmployer")}</RecordLink>
                </span>
              </p>
            ) : null}
          </div>
        ) : job.status === "open" ? (
          <div className="flex flex-col gap-2">
            <div>
              <Button size="sm" variant="outline" disabled={!canWrite || busy} onClick={() => void close.run(undefined)}>
                {close.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Lock />}
                {t("careers.job.close")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("careers.job.closeHint")}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("careers.job.nothingToDecide", { status: labels.jobStatus(job.status) })}
          </p>
        )}

        {job.moderationNote ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="text-xs text-muted-foreground">{t("careers.job.moderationNote")}</p>
            <p dir="auto" className="mt-1 whitespace-pre-line">
              {job.moderationNote}
            </p>
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div>
            <Label htmlFor="job-featured">{t("careers.job.featuredLabel")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{t("careers.job.featuredHint")}</p>
          </div>
          <Switch
            id="job-featured"
            checked={job.featured}
            /* Unfeaturing always works; featuring needs a job that is open. */
            disabled={!canWrite || busy || (!job.featured && job.status !== "open")}
            onCheckedChange={(checked) => void feature.run(checked)}
          />
        </div>

        <ActionError error={approve.error ?? close.error ?? feature.error} />

        <div className="border-t pt-4">
          <Button size="sm" variant="ghost" className="text-destructive" disabled={!canWrite} onClick={() => setDeleting(true)}>
            <Trash2 /> {t("careers.job.delete")}
          </Button>
        </div>
      </div>

      <NoteDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={t("careers.job.rejectTitle")}
        description={t("careers.job.rejectBody")}
        label={t("careers.job.rejectNote")}
        hint={t("careers.job.rejectNoteHint")}
        confirmLabel={t("careers.job.rejectConfirm")}
        onConfirm={async (note) => {
          await careersAdminService.moderateJob(job.id, { decision: "reject", note });
          notice.success(t("careers.job.rejected", { reference: job.reference }));
          onChanged();
        }}
      />

      {/* The refusal (people applied) is the API's 409, shown in the dialog in the reader's words. */}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("careers.job.deleteTitle", { reference: job.reference })}
        description={t("careers.job.deleteBody")}
        onConfirm={async () => {
          try {
            await careersAdminService.deleteJob(job.id);
          } catch (error) {
            if (isAppError(error) && error.code === "conflict" && job.applicationCount > 0) {
              throw new AppError("conflict", t("careers.job.deleteRefused", { count: number(job.applicationCount) }), {
                status: 409,
                cause: error,
              });
            }
            throw error;
          }
          notice.success(t("careers.job.deleted", { reference: job.reference }));
          navigate("/careers/jobs");
        }}
      />
    </Section>
  );
}

function EmployerCard({ job, employer }: { job: AdminJob; employer: AdminEmployer | null }) {
  const { t } = useTranslation();
  const labels = useCareersLabels();
  return (
    <Section
      id="employer"
      title={t("careers.employer")}
      action={<RecordLink to={recordPath.employer(job.employer.id)}>{t("careers.job.openEmployer")}</RecordLink>}
    >
      <div className="flex items-start gap-3">
        <EmployerLogo logo={job.employer.logo} />
        <div className="min-w-0 text-sm">
          <p className="font-medium">
            <span dir="auto">{job.employer.name}</span>
          </p>
          {employer ? (
            <p className="text-muted-foreground">{`${labels.kind(employer.kind)} · ${labels.city(employer.cityId)}`}</p>
          ) : null}
          <div className="mt-2">
            <VerificationBadge status={job.employer.verificationStatus} />
          </div>
          {employer ? (
            <p className="mt-2 truncate text-muted-foreground" dir="ltr">
              {employer.email}
            </p>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

function ExistingJob({ jobId }: { jobId: string }) {
  const { t } = useTranslation();
  const { date, dateTime, number } = useFormatters();

  const state = useAsyncData(async () => {
    const job = await careersAdminService.getJob(jobId);
    if (!job) return null;
    const [employer, sports] = await Promise.all([
      careersAdminService.getEmployer(job.employer.id),
      job.sportIds.length > 0 ? sportsService.getManyByIds(job.sportIds) : Promise.resolve([] as readonly Sport[]),
    ]);
    return { job, employer, sports };
  }, [jobId]);

  return (
    <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={6}>
      {(data) => {
        if (!data) return <StateMessage tone="error" title={t("error.not-found")} />;
        const { job } = data;
        return (
          <>
            <PageHeader
              title={<span dir="auto">{job.title}</span>}
              description={`${job.reference} · ${job.employer.name}`}
              actions={
                <>
                  {job.featured ? (
                    <Badge variant="secondary">
                      <Star className="fill-current text-amber-500" aria-hidden="true" /> {t("careers.jobs.featured")}
                    </Badge>
                  ) : null}
                  <Badge variant={job.isPublic ? "default" : "outline"}>
                    {job.isPublic ? t("careers.job.onBoard") : t("careers.job.notOnBoard")}
                  </Badge>
                  <JobStatusBadge status={job.status} />
                </>
              }
            />

            <div className="grid items-start gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-6 lg:col-span-2">
                <JobPreview job={job} sports={data.sports} />
              </div>
              <div className="flex flex-col gap-6">
                <ReviewPanel job={job} onChanged={state.refetch} />
                <EmployerCard job={job} employer={data.employer} />
                <Section
                  id="applicants"
                  title={t("careers.jobs.applicants")}
                  action={
                    <RecordLink to={`/careers/applications?employer=${job.employer.id}&job=${job.id}`}>
                      {t("careers.job.viewApplications")}
                    </RecordLink>
                  }
                >
                  <p className="text-sm">{t("careers.job.applicantsCount", { count: number(job.applicationCount) })}</p>
                </Section>
                <Section id="record" title={t("careers.job.record")}>
                  <Facts
                    facts={[
                      { label: t("field.reference"), value: <span dir="ltr">{job.reference}</span> },
                      { label: t("careers.job.created"), value: date(job.createdAt) },
                      { label: t("field.updated"), value: dateTime(job.updatedAt) },
                      { label: t("careers.job.posted"), value: job.postedAt ? date(job.postedAt) : t("careers.job.notPosted") },
                    ]}
                  />
                </Section>
              </div>
            </div>
          </>
        );
      }}
    </AsyncBoundary>
  );
}

/** `/careers/jobs/:jobId` — where a `job-submitted` notification lands. */
export function JobDetailRoute() {
  const { jobId = "" } = useParams();
  return (
    <RequirePermission permission="careers:read">
      <BackLink to="/careers/jobs" />
      <ExistingJob key={jobId} jobId={jobId} />
    </RequirePermission>
  );
}
