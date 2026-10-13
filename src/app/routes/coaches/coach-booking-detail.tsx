import { useParams } from "react-router-dom";

import { AsyncBoundary, StateMessage } from "@/components/feedback";
import { PageHeader, StatusBadge } from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  allowedCoachBookingTransitions,
  coachesAdminService,
  type CoachBookingStatus,
} from "@/features/coaches";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, CustomerLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { TransitionActions } from "../../components/transition-actions";
import { orDash, recordPath } from "../../record-paths";

/**
 * One coaching session: who it is for, what they want from it, and where it is
 * in its life. The athlete's goal is their own words, shown as written.
 */
export function CoachBookingDetailRoute() {
  const { bookingId = "" } = useParams();
  const { t } = useTranslation();
  const { text, money, dateTime, number } = useFormatters();
  const canWrite = usePermission("coaches:write");
  const state = useAsyncData(() => coachesAdminService.getBooking(bookingId), [bookingId]);

  const change = useAsyncAction(
    (input: { status: CoachBookingStatus; note?: string }) =>
      coachesAdminService.setBookingStatus(bookingId, input.status, input.note),
    { onSuccess: () => state.refetch() },
  );

  return (
    <RequirePermission permission="coaches:read">
      <BackLink to="/coaches/bookings" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(booking) =>
          booking ? (
            <>
              <PageHeader
                title={`${t("coachBookings.detailTitle")} ${booking.reference}`}
                description={`${text(booking.coachName)} · ${dateTime(booking.startsAt)}`}
                actions={<StatusBadge status={booking.status} />}
              />

              <Section id="status" title={t("orders.changeStatus")}>
                <TransitionActions
                  next={allowedCoachBookingTransitions(booking.status)}
                  needsNote={(status) => status === "cancelled"}
                  onRun={(status, note) => void change.run({ status, note })}
                  disabled={!canWrite}
                  pending={change.isPending}
                  error={change.error}
                  fieldError={change.fieldErrors?.note}
                  emptyLabel={t("coachBookings.final")}
                />
              </Section>

              <div className="grid gap-4 lg:grid-cols-2">
                <Section id="session" title={t("coachBookings.session")}>
                  <Facts
                    facts={[
                      {
                        label: t("field.coach"),
                        value: <RecordLink to={recordPath.coach(booking.coachId)}>{text(booking.coachName)}</RecordLink>,
                      },
                      { label: t("field.package"), value: text(booking.packageName) },
                      { label: t("field.startsAt"), value: dateTime(booking.startsAt) },
                      { label: t("coachBookings.mode"), value: orDash(booking.mode) },
                      {
                        label: t("coachBookings.sessions"),
                        value:
                          booking.sessionCount === undefined
                            ? orDash(undefined)
                            : booking.sessionCount > 1
                              ? t("coachBookings.blockNote", { count: number(booking.sessionCount) })
                              : number(1),
                      },
                      { label: t("field.total"), value: money(booking.total) },
                    ]}
                  />
                </Section>

                <Section id="athlete" title={t("coachBookings.athlete")}>
                  <Facts
                    facts={[
                      {
                        label: t("coachBookings.paidBy"),
                        value: booking.customerId ? (
                          <CustomerLink id={booking.customerId} name={booking.contact.name} />
                        ) : (
                          <span dir="auto">{booking.contact.name}</span>
                        ),
                      },
                      { label: t("field.email"), value: <span dir="ltr">{booking.contact.email}</span> },
                      {
                        label: t("field.phone"),
                        value: orDash(booking.contact.phone && <span dir="ltr">{booking.contact.phone}</span>),
                      },
                      { label: t("field.submitted"), value: dateTime(booking.audit.createdAt) },
                    ]}
                  />
                  <div className="mt-4 text-sm">
                    <p className="text-muted-foreground">{t("coachBookings.goal")}</p>
                    <p className="mt-1 max-w-prose" dir="auto">
                      {orDash(booking.goal)}
                    </p>
                  </div>
                  {booking.statusNote ? (
                    <p className="mt-4 text-xs text-muted-foreground" dir="auto">
                      {`${t("field.note")}: ${booking.statusNote}`}
                    </p>
                  ) : null}
                </Section>
              </div>
            </>
          ) : (
            <StateMessage tone="error" title={t("error.not-found")} />
          )
        }
      </AsyncBoundary>
    </RequirePermission>
  );
}
