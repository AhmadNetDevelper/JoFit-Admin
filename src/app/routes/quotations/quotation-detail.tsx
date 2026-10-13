import { Loader2, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { Field, FormError, FormSection } from "@/components/form";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { RequirePermission, useSession, usePermission } from "@/features/auth";
import {
  QUOTATION_STATUSES,
  quotationsAdminService,
  type QuotationRequest,
  type QuotationStatus,
} from "@/features/quotations";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink } from "../../components/record-parts";

function QuotationActions({
  request,
  onChanged,
}: {
  request: QuotationRequest;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const { session } = useSession();
  const canWrite = usePermission("quotations:write");
  const [note, setNote] = useState(request.internalNote ?? "");

  const assign = useAsyncAction(
    (assigneeId: string | null) => quotationsAdminService.assign(request.id, assigneeId),
    { onSuccess: onChanged },
  );

  const setStatus = useAsyncAction(
    (status: QuotationStatus) => quotationsAdminService.setStatus(request.id, status, note),
    { onSuccess: onChanged },
  );

  return (
    <FormSection
      title={t("field.status")}
      actions={<StatusBadge status={request.status} />}
    >
      <div id="quotation-actions" className="flex flex-col gap-5">
        {/* Who is on it: the one decision taken before anything else. */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("field.assignee")}</p>
            <p className="truncate font-medium" dir="auto">
              {request.assigneeName ?? request.assigneeId ?? "—"}
            </p>
          </div>
          {request.assigneeId ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!canWrite || assign.isPending}
              onClick={() => void assign.run(null)}
            >
              {assign.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserMinus />}
              {t("action.unassign")}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="default"
              disabled={!canWrite || assign.isPending || !session}
              onClick={() => void assign.run(session?.user.id ?? null)}
            >
              {assign.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus />}
              {t("action.assignToMe")}
            </Button>
          )}
        </div>

        <div>
          <Field
            label={t("quotations.internalNote")}
            hint={t("quotations.internalNoteHint")}
            error={setStatus.fieldErrors?.internalNote}
            className="mb-4"
          >
            {(props) => (
              <Textarea
                {...props}
                rows={3}
                dir="auto"
                className="min-h-20"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            )}
          </Field>

          <p id="quotation-move-to" className="mb-2 text-sm font-medium">
            {t("quotations.moveTo")}
          </p>
          <div role="group" aria-labelledby="quotation-move-to" className="flex flex-wrap gap-2">
            {QUOTATION_STATUSES.filter((status) => status !== request.status).map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant="outline"
                disabled={!canWrite || setStatus.isPending}
                onClick={() => void setStatus.run(status)}
              >
                {t(`statusLabel.${status}`)}
              </Button>
            ))}
            {setStatus.isPending ? (
              <Loader2 className="size-4 animate-spin self-center text-muted-foreground" aria-hidden="true" />
            ) : null}
          </div>
        </div>

        <FormError error={assign.error ?? setStatus.error} />
      </div>
    </FormSection>
  );
}

export function QuotationDetailRoute() {
  const { quotationId = "" } = useParams();
  const { t } = useTranslation();
  const { dateTime, money, number } = useFormatters();
  const navigate = useNavigate();
  const notice = useNotice();
  const canWrite = usePermission("quotations:write");
  const [deleting, setDeleting] = useState(false);
  const state = useAsyncData(() => quotationsAdminService.getRequest(quotationId), [quotationId]);

  return (
    <RequirePermission permission="quotations:read">
      <BackLink to="/quotations" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(request) =>
          request ? (
            <>
              <PageHeader
                title={`${t("quotations.detailTitle")} ${request.reference}`}
                description={`${request.organisationName} · ${dateTime(request.submittedAt)}`}
                actions={
                  <>
                    <StatusBadge status={request.status} />
                    {canWrite ? (
                      <Button type="button" variant="destructive" onClick={() => setDeleting(true)}>
                        <Trash2 /> {t("crud.delete")}
                      </Button>
                    ) : null}
                  </>
                }
              />

              {/* What was asked on the main side; what staff do about it on the side. */}
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="flex min-w-0 flex-col gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("section.details")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                        <div className="space-y-1">
                          <dt className="text-xs text-muted-foreground">{t("field.name")}</dt>
                          <dd className="font-medium" dir="auto">
                            {request.contactName}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs text-muted-foreground">{t("field.email")}</dt>
                          <dd className="font-medium">
                            <a href={`mailto:${request.email}`} dir="ltr" className="underline-offset-4 hover:underline">
                              {request.email}
                            </a>
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs text-muted-foreground">{t("field.units")}</dt>
                          <dd className="font-medium" data-figure>
                            {request.quantityEstimate ? number(request.quantityEstimate) : "—"}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs text-muted-foreground">{t("field.price")}</dt>
                          <dd className="font-medium" data-figure>
                            {/* Live `AdminQuotationDto.budgetRange` is free text (not a structured
                                min/max), so it's shown as written rather than parsed into `Money`.
                                See `QuotationRequest.budgetRangeText` in features/quotations/types.ts. */}
                            {request.budgetRange
                              ? `${money(request.budgetRange.min)} – ${money(request.budgetRange.max)}`
                              : (request.budgetRangeText ?? "—")}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle id="message-heading">{t("quotations.message")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Customer-written text: rendered as submitted, direction auto-detected. */}
                      <p className="max-w-prose text-sm leading-relaxed whitespace-pre-wrap" dir="auto">
                        {request.message}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-16">
                  <QuotationActions request={request} onChanged={state.refetch} />
                </div>
              </div>

              <ConfirmDialog
                open={deleting}
                onOpenChange={setDeleting}
                title={t("crud.deleteTitle", { name: request.reference })}
                description={t("quotations.deleteBody")}
                onConfirm={async () => {
                  await quotationsAdminService.deleteRequest(request.id);
                  notice.success(t("crud.deleted", { name: request.reference }));
                  navigate("/quotations");
                }}
              />
            </>
          ) : (
            <StateMessage tone="error" title={t("state.errorTitle")} />
          )
        }
      </AsyncBoundary>
    </RequirePermission>
  );
}
