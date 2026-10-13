import { Download, FileText, Info, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";

import { AsyncBoundary, StateMessage } from "@/components/feedback";
import { Button, PageHeader } from "@/components/ui";
import { RequirePermission } from "@/features/auth";
import { careersAdminService, type AdminJobApplication } from "@/features/careers";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, CustomerLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { orDash, recordPath } from "../../record-paths";
import { saveBlob, useCareersLabels } from "./careers-labels";
import { ActionError, ApplicationStatusBadge, EmployerLogo, JobStatusBadge, WrittenText } from "./careers-parts";

/**
 * The CV, fetched only when asked for. It is private — the candidate's, the
 * employer's and JoFit's — so it is downloaded, never shown inline or kept.
 */
function CvCard({ application }: { application: AdminJobApplication }) {
  const { t } = useTranslation();
  const { number } = useFormatters();
  const download = useAsyncAction(() => careersAdminService.downloadCv(application.id), {
    onSuccess: (file) => saveBlob(file.blob, file.fileName || application.cv.fileName),
  });

  return (
    <Section id="cv" title={t("careers.application.cv")} description={t("careers.application.cvHint")}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              <span dir="auto">{application.cv.fileName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("careers.application.fileSize", { size: number(Math.max(1, Math.round(application.cv.bytes / 1024))) })}
            </p>
          </div>
        </div>
        <div>
          <Button size="sm" disabled={download.isPending} onClick={() => void download.run(undefined)}>
            {download.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download />}
            {download.isPending ? t("careers.application.downloading") : t("careers.application.download")}
          </Button>
        </div>
        <ActionError error={download.error} />
      </div>
    </Section>
  );
}

function ExistingApplication({ applicationId }: { applicationId: string }) {
  const { t } = useTranslation();
  const { date, dateTime, money, number } = useFormatters();
  const labels = useCareersLabels();
  const state = useAsyncData(() => careersAdminService.getApplication(applicationId), [applicationId]);

  return (
    <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={5}>
      {(application) => {
        if (!application) return <StateMessage tone="error" title={t("error.not-found")} />;
        return (
          <>
            <PageHeader
              title={<span dir="auto">{application.candidate.name}</span>}
              description={`${application.reference} · ${application.job.title}`}
              actions={<ApplicationStatusBadge status={application.status} />}
            />

            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="size-4 shrink-0" aria-hidden="true" />
              {t("careers.application.readOnly")}
            </p>

            <div className="grid items-start gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-6 lg:col-span-2">
                <Section id="application" title={t("careers.application.details")}>
                  <Facts
                    columns={2}
                    facts={[
                      {
                        label: t("careers.applications.job"),
                        value: (
                          <span className="inline-flex flex-wrap items-center gap-2">
                            <RecordLink to={recordPath.job(application.job.id)}>
                              <span dir="auto">{application.job.title}</span>
                            </RecordLink>
                            {/* The live ApplicationJobRef has no job status at all. */}
                            {application.job.status ? <JobStatusBadge status={application.job.status} /> : null}
                          </span>
                        ),
                      },
                      {
                        label: t("careers.employer"),
                        value: (
                          <span className="inline-flex items-center gap-2">
                            <EmployerLogo logo={application.employer.logo} />
                            <RecordLink to={recordPath.employer(application.employer.id)}>
                              <span dir="auto">{application.employer.name}</span>
                            </RecordLink>
                          </span>
                        ),
                      },
                      { label: t("careers.application.years"), value: number(application.yearsExperience) },
                      {
                        label: t("careers.application.certifications"),
                        value: orDash(application.certifications ? <span dir="auto">{application.certifications}</span> : undefined),
                      },
                      {
                        label: t("careers.application.availableFrom"),
                        value: application.availableFrom ? date(application.availableFrom) : t("careers.application.notGiven"),
                      },
                      {
                        label: t("careers.application.expectedSalary"),
                        value: application.expectedSalary
                          ? t("careers.application.perMonth", { amount: money(application.expectedSalary) })
                          : t("careers.application.notGiven"),
                      },
                      { label: t("field.submitted"), value: dateTime(application.submittedAt) },
                      { label: t("field.updated"), value: dateTime(application.updatedAt) },
                    ]}
                  />
                </Section>

                <Section id="letter" title={t("careers.application.coverLetter")}>
                  <WrittenText empty="—">{application.coverLetter}</WrittenText>
                </Section>

                {application.statusNote ? (
                  <Section id="status-note" title={t("careers.application.statusNote")}>
                    <WrittenText empty="—">{application.statusNote}</WrittenText>
                  </Section>
                ) : null}
              </div>

              <div className="flex flex-col gap-6">
                <Section
                  id="candidate"
                  title={t("careers.application.candidate")}
                  action={
                    <RecordLink to={recordPath.customer(application.customerId)}>
                      {t("careers.application.customerRecord")}
                    </RecordLink>
                  }
                >
                  <Facts
                    columns={2}
                    facts={[
                      { label: t("field.name"), value: <CustomerLink id={application.customerId} name={application.candidate.name} /> },
                      { label: t("field.email"), value: <span dir="ltr">{application.candidate.email}</span> },
                      {
                        label: t("field.phone"),
                        value: orDash(application.candidate.phone ? <span dir="ltr">{application.candidate.phone}</span> : undefined),
                      },
                    ]}
                  />
                </Section>

                <CvCard application={application} />

                <Section id="history" title={t("careers.application.history")}>
                  <ol className="flex flex-col gap-3 border-s ps-4 text-sm">
                    {application.history.map((step, index) => (
                      <li key={`${step.status}-${step.at}-${index}`} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -start-[1.3rem] top-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
                        />
                        <p className="font-medium">{labels.appStatus(step.status)}</p>
                        <p className="text-xs text-muted-foreground">{`${dateTime(step.at)} · ${labels.by(step.by)}`}</p>
                      </li>
                    ))}
                  </ol>
                </Section>
              </div>
            </div>
          </>
        );
      }}
    </AsyncBoundary>
  );
}

/** `/careers/applications/:applicationId` — read-only, with the CV. */
export function ApplicationDetailRoute() {
  const { applicationId = "" } = useParams();
  return (
    <RequirePermission permission="careers:read">
      <BackLink to="/careers/applications" />
      <ExistingApplication key={applicationId} applicationId={applicationId} />
    </RequirePermission>
  );
}
