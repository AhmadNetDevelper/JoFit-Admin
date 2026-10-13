import { CalendarCheck, GraduationCap, ReceiptText, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";

import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, StateMessage } from "@/components/feedback";
import {
  Badge,
  ListCard,
  MetricCard,
  PageHeader,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { isFeatureEnabled } from "@/config";
import { RequirePermission, usePermission } from "@/features/auth";
import { coachesAdminService } from "@/features/coaches";
import { communityAdminService } from "@/features/community";
import { customersService, type Customer } from "@/features/customers";
import { educationAdminService } from "@/features/education";
import { ordersService } from "@/features/orders";
import { rentalAdminService } from "@/features/rental";
import { reviewsAdminService } from "@/features/reviews";
import { sportsService } from "@/features/sports";
import { useAsyncData } from "@/hooks";
import { LOCALE_LABELS, useFormatters, useTranslation, type TranslationKey } from "@/i18n";
import type { Paginated } from "@/types";

import { BackLink, Facts, RecordLink, Section } from "../../components/record-parts";
import { EditCustomerButton } from "./edit-customer-dialog";
import { orDash, recordPath, reviewTargetPath } from "../../record-paths";

/**
 * ONE PERSON, EVERYTHING THEY HAVE DONE WITH US.
 *
 * The storefront's account area is where every domain converges for the
 * customer; this is the same convergence for staff. It is a composition screen
 * like the dashboard: each domain is asked for this customer's records through
 * its own public service, and the screen owns no data. That is only possible
 * because every record in every domain carries the same `customerId` — the
 * customer domain itself imports none of them.
 *
 * Staff may correct the contact details and preferences (Edit details); the
 * records themselves are acted on where they live — every row links there.
 *
 * Each tab is one page of that domain's own paged collection, filtered to this
 * customer (`GET /v1/admin/orders?customerId=…&page=…` and so on), read when
 * the tab is opened. The page a tab is on is kept in component state, not the
 * URL.
 */
const PAGE_SIZE = 10;

export function CustomerDetailRoute() {
  const { customerId = "" } = useParams();
  const { t } = useTranslation();
  const { money, date, dateTime, number, text, list } = useFormatters();
  const canEdit = usePermission("customers:write");

  const state = useAsyncData(async () => {
    const customer = await customersService.getCustomer(customerId);
    if (!customer) return null;
    const sports = await sportsService.getManyByIds(customer.preferences.favouriteSportIds);
    return { customer, sports };
  }, [customerId]);

  return (
    <RequirePermission permission="customers:read">
      <BackLink to="/customers" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={6}>
        {(data) => {
          if (!data) return <StateMessage tone="error" title={t("error.not-found")} />;
          const { customer } = data;
          const favourite = list(data.sports.map((sport) => text(sport.name)));

          return (
            <>
              <PageHeader
                title={customer.name}
                description={[customer.email, customer.phone, customer.city].filter(Boolean).join(" · ")}
                actions={
                  <div className="flex flex-wrap items-center gap-2">
                    {customer.preferences.marketingOptIn ? (
                      <Badge variant="secondary">{t("customers.optedIn")}</Badge>
                    ) : (
                      <Badge variant="outline">{t("customers.optedOut")}</Badge>
                    )}
                    {canEdit ? <EditCustomerButton customer={customer} onSaved={state.refetch} /> : null}
                  </div>
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={Wallet}
                  label={t("field.lifetimeValue")}
                  value={money(customer.lifetimeValue)}
                  claim={t("customers.valueClaim")}
                />
                <MetricCard
                  icon={ReceiptText}
                  label={t("field.orders")}
                  value={number(customer.activity.orders)}
                  claim={
                    customer.lastOrderAt
                      ? `${t("field.lastOrder")}: ${date(customer.lastOrderAt)}`
                      : t("customers.noOrders")
                  }
                />
                <MetricCard
                  icon={CalendarCheck}
                  label={t("customers.sessions")}
                  value={number(customer.activity.coachBookings)}
                  claim={`${t("customers.hires")}: ${number(customer.activity.rentalBookings)}`}
                />
                <MetricCard
                  icon={GraduationCap}
                  label={t("customers.coursePlaces")}
                  value={number(customer.activity.enrolments)}
                  claim={`${t("nav.reviews")}: ${number(customer.activity.reviews)}`}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Section id="profile" title={t("customers.profile")}>
                    <Facts
                      facts={[
                        { label: t("field.email"), value: <span dir="ltr">{customer.email}</span> },
                        { label: t("field.phone"), value: <span dir="ltr">{orDash(customer.phone)}</span> },
                        { label: t("customers.language"), value: LOCALE_LABELS[customer.preferences.locale] },
                        { label: t("customers.favouriteSports"), value: orDash(favourite) },
                        { label: t("customers.since"), value: date(customer.audit.createdAt) },
                        {
                          label: t("customers.lastActive"),
                          value: customer.lastActiveAt ? dateTime(customer.lastActiveAt) : "—",
                        },
                      ]}
                    />
                  </Section>
                </div>
                <Section id="addresses" title={t("customers.addresses")}>
                  {(customer.addresses ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("customers.noAddress")}</p>
                  ) : (
                    <ul className="space-y-3 text-sm">
                      {(customer.addresses ?? []).map((address) => (
                        <li key={address.id} dir="auto">
                          <p className="font-medium">{address.recipientName}</p>
                          <p className="text-muted-foreground">{address.line1}</p>
                          <p className="text-muted-foreground">{`${address.city}, ${address.countryCode}`}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              </div>

              <CustomerRecords key={customer.id} customer={customer} />
            </>
          );
        }}
      </AsyncBoundary>
    </RequirePermission>
  );
}

type Tab = "orders" | "hires" | "coaching" | "courses" | "reviews" | "community";

/**
 * The customer's records, one tab per domain. Each tab reads one page of that
 * domain's collection, filtered to this customer; the page each tab is on is
 * kept here, so switching tabs and back returns to it. The counts on the tabs
 * are the customer's activity figures, derived from the same records.
 */
function CustomerRecords({ customer }: { customer: Customer }) {
  const { t } = useTranslation();
  const { money, date, dateTime, number, text } = useFormatters();
  const canSeeCommunity = usePermission("community:moderate") && isFeatureEnabled("community");
  const [pages, setPages] = useState<Readonly<Partial<Record<Tab, number>>>>({});
  const customerId = customer.id;
  const paging = (tab: Tab) => ({
    page: pages[tab] ?? 1,
    onPageChange: (page: number) => setPages((current) => ({ ...current, [tab]: page })),
  });
  const scope = (page: number) => ({ customerId, page, pageSize: PAGE_SIZE });

  const tabs: readonly { value: Tab; label: TranslationKey; count: number }[] = [
    { value: "orders", label: "customers.tabOrders", count: customer.activity.orders },
    { value: "hires", label: "customers.tabHires", count: customer.activity.rentalBookings },
    { value: "coaching", label: "customers.tabCoaching", count: customer.activity.coachBookings },
    { value: "courses", label: "customers.tabCourses", count: customer.activity.enrolments },
    { value: "reviews", label: "customers.tabReviews", count: customer.activity.reviews },
    ...(canSeeCommunity
      ? [{ value: "community" as const, label: "customers.tabCommunity" as const, count: customer.activity.communityPosts }]
      : []),
  ];

  return (
    <Tabs defaultValue="orders" className="gap-4">
      <TabsList className="h-auto flex-wrap">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {`${t(tab.label)} (${number(tab.count)})`}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="orders">
        <RecordList
          {...paging("orders")}
          load={(page) => ordersService.listOrders(scope(page))}
          caption={t("customers.tabOrders")}
          getKey={(order) => order.id}
          columns={[
            { header: t("field.reference"), cell: (order) => <RecordLink to={`/orders/${order.id}`}>{order.reference}</RecordLink> },
            { header: t("field.status"), cell: (order) => <StatusBadge status={order.status} /> },
            { header: t("field.placedAt"), cell: (order) => dateTime(order.placedAt) },
            { header: t("orders.lines"), cell: (order) => number(order.lines.length) },
            { header: t("field.total"), cell: (order) => money(order.grandTotal) },
          ]}
        />
      </TabsContent>

      <TabsContent value="hires">
        <RecordList
          {...paging("hires")}
          load={(page) => rentalAdminService.listBookings({ ...scope(page), sort: { field: "from", direction: "desc" } })}
          caption={t("customers.tabHires")}
          getKey={(hire) => hire.id}
          columns={[
            { header: t("field.reference"), cell: (hire) => <RecordLink to={recordPath.rentalBooking(hire.reference)}>{hire.reference}</RecordLink> },
            { header: t("field.title"), cell: (hire) => text(hire.itemTitle) },
            { header: t("field.period"), cell: (hire) => `${date(hire.period.from)} – ${date(hire.period.to)}` },
            { header: t("field.status"), cell: (hire) => <StatusBadge status={hire.status} /> },
            { header: t("field.total"), cell: (hire) => money(hire.total) },
          ]}
        />
      </TabsContent>

      <TabsContent value="coaching">
        <RecordList
          {...paging("coaching")}
          load={(page) => coachesAdminService.listBookings(scope(page))}
          caption={t("customers.tabCoaching")}
          getKey={(session) => session.id}
          columns={[
            { header: t("field.reference"), cell: (session) => <RecordLink to={`/coaches/bookings/${session.id}`}>{session.reference}</RecordLink> },
            { header: t("field.coach"), cell: (session) => <RecordLink to={`/coaches/${session.coachId}`}>{text(session.coachName)}</RecordLink> },
            { header: t("field.package"), cell: (session) => text(session.packageName) },
            { header: t("field.startsAt"), cell: (session) => dateTime(session.startsAt) },
            { header: t("field.status"), cell: (session) => <StatusBadge status={session.status} /> },
            { header: t("field.total"), cell: (session) => money(session.total) },
          ]}
        />
      </TabsContent>

      <TabsContent value="courses">
        <RecordList
          {...paging("courses")}
          load={(page) => educationAdminService.listEnrolments(scope(page))}
          caption={t("customers.tabCourses")}
          getKey={(seat) => seat.id}
          columns={[
            { header: t("field.reference"), cell: (seat) => seat.reference },
            { header: t("field.course"), cell: (seat) => <RecordLink to={`/education/courses/${seat.courseId}`}>{text(seat.courseTitle)}</RecordLink> },
            { header: t("field.cohort"), cell: (seat) => date(seat.cohortStartsOn) },
            { header: t("field.status"), cell: (seat) => <StatusBadge status={seat.status} /> },
            { header: t("field.paid"), cell: (seat) => money(seat.amountPaid) },
          ]}
        />
      </TabsContent>

      <TabsContent value="reviews">
        <RecordList
          {...paging("reviews")}
          load={(page) => reviewsAdminService.listReviews(scope(page))}
          caption={t("customers.tabReviews")}
          getKey={(review) => review.id}
          columns={[
            { header: t("field.target"), cell: (review) => <RecordLink to={reviewTargetPath(review.target.type, review.target.id)}> {review.target.title} </RecordLink> },
            { header: t("field.rating"), cell: (review) => `${review.rating}/5` },
            { header: t("field.status"), cell: (review) => <StatusBadge status={review.moderationStatus} /> },
            { header: t("field.submitted"), cell: (review) => date(review.submittedAt) },
          ]}
        />
      </TabsContent>

      {canSeeCommunity ? (
        <TabsContent value="community">
          <RecordList
            {...paging("community")}
            load={(page) => communityAdminService.listPosts(scope(page))}
            caption={t("customers.tabCommunity")}
            getKey={(post) => post.id}
            columns={[
              { header: t("field.title"), cell: (post) => <RecordLink to={`/community/${post.id}`}> <span dir="auto">{post.title}</span> </RecordLink> },
              { header: t("field.status"), cell: (post) => <StatusBadge status={post.moderationStatus} /> },
              { header: t("community.reports"), cell: (post) => number(post.reportCount) },
              { header: t("field.submitted"), cell: (post) => date(post.createdAt) },
            ]}
          />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

/**
 * One tab's table: a page of the customer's records, and the pager under it.
 * The page number belongs to the caller, which keeps one per tab. The last
 * column is a figure (a total, a date) and aligns to the end.
 */
function RecordList<TRow>({
  load,
  page,
  onPageChange,
  caption,
  getKey,
  columns,
}: {
  load: (page: number) => Promise<Paginated<TRow>>;
  page: number;
  onPageChange: (page: number) => void;
  caption: string;
  getKey: (row: TRow) => string;
  columns: readonly { header: string; cell: (row: TRow) => ReactNode }[];
}) {
  const { t } = useTranslation();
  /* `load` is written inline by the caller; the page is what identifies the request. */
  const state = useAsyncData(() => load(page), [page]);
  const last = columns.length - 1;
  const tableColumns: readonly DataTableColumn<TRow>[] = columns.map((column, index) => ({
    key: column.header,
    header: column.header,
    align: index === last ? "end" : "start",
    render: index === last ? (row: TRow) => <span data-figure>{column.cell(row)}</span> : column.cell,
  }));

  return (
    <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={3}>
      {(result) => (
        <ListCard footer={<PaginationControls meta={result.meta} onPageChange={onPageChange} />}>
          <DataTable
            caption={caption}
            columns={tableColumns}
            rows={result.items}
            getRowKey={getKey}
            emptyLabel={t("customers.noneYet")}
          />
        </ListCard>
      )}
    </AsyncBoundary>
  );
}
