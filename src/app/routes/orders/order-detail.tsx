import { useParams } from "react-router-dom";

import { AsyncBoundary, StateMessage } from "@/components/feedback";
import { Card, CardContent, PageHeader, StatusBadge } from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import { allowedTransitions, ordersService, type OrderStatus } from "@/features/orders";
import { rentalAdminService } from "@/features/rental";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, CustomerLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { TransitionActions } from "../../components/transition-actions";
import { recordPath } from "../../record-paths";

/**
 * One order, and everything it points at.
 *
 * Status actions are generated from the transition graph, so the screen can only
 * ever offer moves the domain permits. Every line links to what it sold — the
 * product, or for a hire the booking the depot works from — and the customer is
 * one click away, because "who is this and what else have they bought" is the
 * next question support asks.
 */
export function OrderDetailRoute() {
  const { orderId = "" } = useParams();
  const { t } = useTranslation();
  const { money, dateTime, date, number } = useFormatters();
  const canWrite = usePermission("orders:write");

  const state = useAsyncData(async () => {
    const order = await ordersService.getOrder(orderId);
    if (!order) return null;
    const hires = order.lines.some((line) => line.kind === "rental")
      ? (await rentalAdminService.listBookings({ orderId, pageSize: 20 })).items
      : [];
    return { order, hires };
  }, [orderId]);

  const change = useAsyncAction(
    (status: OrderStatus) => ordersService.setOrderStatus(orderId, status),
    { onSuccess: () => state.refetch() },
  );

  return (
    <RequirePermission permission="orders:read">
      <BackLink to="/orders" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(data) => {
          if (!data) return <StateMessage tone="error" title={t("error.not-found")} />;
          const { order } = data;
          const address = order.shippingAddress;

          return (
            <>
              <PageHeader
                title={`${t("orders.detailTitle")} ${order.reference}`}
                description={`${order.customer.name} · ${dateTime(order.placedAt)}`}
                actions={<StatusBadge status={order.status} />}
              />

              <Section id="status" title={t("orders.changeStatus")}>
                <TransitionActions
                  next={allowedTransitions(order.status)}
                  onRun={(status) => void change.run(status)}
                  disabled={!canWrite}
                  pending={change.isPending}
                  error={change.error}
                  emptyLabel={t("orders.noTransitions")}
                />
              </Section>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Section id="lines" title={t("orders.lines")}>
                    <ul className="divide-y divide-border text-sm">
                      {order.lines.map((line) => {
                        const hire = data.hires.find((entry) => entry.id === line.rentalBookingId);
                        const to = line.productId
                          ? recordPath.product(line.productId)
                          : line.rentalItemId
                            ? recordPath.rentalItemBookings(line.rentalItemId)
                            : undefined;
                        return (
                          <li
                            key={line.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0"
                          >
                            <span className="min-w-0">
                              {to ? <RecordLink to={to}>{line.title}</RecordLink> : line.title}
                              {line.description ? (
                                <span className="text-muted-foreground">{` · ${line.description}`}</span>
                              ) : null}
                              {line.rentalPeriod ? (
                                <span className="block text-xs text-muted-foreground">
                                  {`${date(line.rentalPeriod.from)} – ${date(line.rentalPeriod.to)}`}
                                  {hire ? (
                                    <>
                                      {" · "}
                                      <RecordLink to={recordPath.rentalBooking(hire.reference)}>{hire.reference}</RecordLink>
                                      {" · "}
                                      <StatusBadge status={hire.status} />
                                    </>
                                  ) : null}
                                </span>
                              ) : null}
                            </span>
                            <span className="ms-auto flex gap-6">
                              <span className="text-muted-foreground" data-figure>
                                {`${number(line.quantity)} × ${money(line.unitPrice)}`}
                              </span>
                              <span data-figure className="w-24 text-end font-medium">
                                {money(line.total)}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Section>
                </div>

                <Section id="customer" title={t("field.customer")}>
                  <Facts
                    columns={2}
                    facts={[
                      { label: t("field.name"), value: <CustomerLink id={order.customer.id} name={order.customer.name} /> },
                      { label: t("field.email"), value: order.customer.email },
                    ]}
                  />
                  <p className="mt-4 text-sm text-muted-foreground">{t("orders.deliverTo")}</p>
                  {address ? (
                    <p className="mt-1 text-sm" dir="auto">
                      {`${address.recipientName}, ${address.line1}, ${address.city}`}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm">{t("orders.collection")}</p>
                  )}
                </Section>
              </div>

              {/*
                The grand total is the number this screen exists to confirm, so
                it is the only one set at figure size. A deposit is money held,
                not money taken, and is labelled as such rather than folded in.
              */}
              <Card className="max-w-sm">
                <CardContent className="text-sm">
                  <dl>
                    <div className="flex justify-between py-1">
                      <dt className="text-muted-foreground">{t("orders.subtotal")}</dt>
                      <dd data-figure>{money(order.itemsSubtotal)}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt className="text-muted-foreground">{t("orders.delivery")}</dt>
                      <dd data-figure>{money(order.shippingTotal)}</dd>
                    </div>
                    <div className="flex justify-between py-1">
                      <dt className="text-muted-foreground">{t("orders.tax")}</dt>
                      <dd data-figure>{money(order.taxTotal)}</dd>
                    </div>
                    <div className="flex justify-between border-b border-border py-1 pb-3">
                      <dt className="text-muted-foreground">{t("orders.depositHeld")}</dt>
                      <dd data-figure>{money(order.depositsTotal)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between pt-3">
                      <dt className="font-semibold">{t("field.total")}</dt>
                      <dd data-figure className="text-lg font-semibold">
                        {money(order.grandTotal)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </>
          );
        }}
      </AsyncBoundary>
    </RequirePermission>
  );
}
