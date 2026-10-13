import {
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CircleCheckBig,
  DollarSign,
  Dumbbell,
  FileSpreadsheet,
  Flag,
  GraduationCap,
  PackageX,
  ReceiptText,
  Star,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Link } from "react-router-dom";

import { AsyncBoundary } from "@/components/feedback";
import { apiConfig } from "@/config";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricCard,
  StatusBadge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
/* Its own path, not the barrel: see the note in components/ui/index.ts. */
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useSession } from "@/features/auth";
import { careersAdminService } from "@/features/careers";
import { catalogueService, hasLowStock } from "@/features/catalogue";
import { coachesAdminService } from "@/features/coaches";
import { communityAdminService } from "@/features/community";
import { customersService } from "@/features/customers";
import { educationAdminService } from "@/features/education";
import { ordersService, type Order } from "@/features/orders";
import { quotationsAdminService } from "@/features/quotations";
import { rentalAdminService } from "@/features/rental";
import { reviewsAdminService } from "@/features/reviews";
import { useAsyncData } from "@/hooks";
import { useFormatters, useTranslation, type TranslationKey } from "@/i18n";

import { useActionCounts } from "../use-action-counts";
import { changeRatio, isEarning, revenueByMonth, revenueTotal } from "./dashboard-metrics";

/**
 * The dashboard is a *composition* screen: it asks each domain for what it holds
 * through that domain's public service and owns no data of its own. Every call
 * runs in parallel, so one slow domain does not serialise the rest.
 *
 * HOW THE PAGE IS ORDERED
 * A welcome band, then four figures with their direction, then the trend they
 * came from, then the records. The queues sit beside the trend because they are
 * what someone acts on: the figures explain the month, the queues are today.
 *
 * WHAT THIS IS NOT
 * It is not an analytics product. Every figure is aggregated in the browser from
 * mock fixtures, which works against a fixture set and will not work against a
 * real catalogue. There is no analytics domain and this does not pretend to be
 * one — see ARCHITECTURE.md §18, and `dashboard-metrics.ts` for the seam where
 * it becomes one endpoint.
 */
interface DashboardData {
  readonly orders: readonly Order[];
  readonly pendingReviews: number;
  readonly newQuotations: number;
  readonly pendingCoaches: number;
  readonly openOrders: number;
  readonly lowStock: number;
  readonly customers: number;
  readonly pendingSessions: number;
  readonly pendingSeats: number;
  readonly flaggedPosts: number;
  readonly depositsToRelease: number;
  readonly employersToVerify: number;
  readonly jobsToReview: number;
}

type Period = "3" | "6" | "12";

export function DashboardRoute() {
  const { t } = useTranslation();
  const { number, money, dateTime, month } = useFormatters();
  const [period, setPeriod] = useState<Period>("6");

  const state = useAsyncData<DashboardData>(async () => {
    const [
      orders,
      olderOrders,
      pendingReviews,
      newQuotations,
      coaches,
      openOrders,
      products,
      customers,
      pendingSessions,
      pendingSeats,
      flaggedPosts,
      returned,
      careers,
    ] =
      await Promise.all([
        /* Two pages: a year of trading is more than the 100-row page cap. */
        ordersService.listOrders({ pageSize: 100 }),
        ordersService.listOrders({ pageSize: 100, page: 2 }),
        reviewsAdminService.countPending(),
        quotationsAdminService.countNew(),
        coachesAdminService.listCoaches({ statuses: ["pending"], pageSize: 1 }),
        ordersService.listOrders({
          statuses: ["pending", "confirmed", "processing"],
          pageSize: 1,
        }),
        catalogueService.listProducts({ pageSize: 100 }),
        customersService.listCustomers({ pageSize: 1 }),
        coachesAdminService.listBookings({ statuses: ["pending"], pageSize: 1 }),
        educationAdminService.listEnrolments({ statuses: ["pending"], pageSize: 1 }),
        communityAdminService.countFlagged(),
        rentalAdminService.listBookings({ statuses: ["returned"], pageSize: 100 }),
        careersAdminService.countPending().catch(() => ({ employers: 0, jobs: 0 })),
      ]);

    return {
      orders: [...orders.items, ...olderOrders.items],
      pendingReviews,
      newQuotations,
      pendingCoaches: coaches.meta.totalItems,
      openOrders: openOrders.meta.totalItems,
      lowStock: products.items.filter(hasLowStock).length,
      customers: customers.meta.totalItems,
      pendingSessions: pendingSessions.meta.totalItems,
      pendingSeats: pendingSeats.meta.totalItems,
      flaggedPosts,
      depositsToRelease: returned.items.filter((booking) => booking.deposit && !booking.depositReleasedAt).length,
      employersToVerify: careers.employers,
      jobsToReview: careers.jobs,
    };
  }, []);

  const queues: readonly {
    key: TranslationKey;
    to: string;
    icon: LucideIcon;
    select: (data: DashboardData) => number;
  }[] = [
    { key: "dashboard.newQuotations", to: "/quotations", icon: FileSpreadsheet, select: (d) => d.newQuotations },
    { key: "dashboard.pendingReviews", to: "/reviews", icon: Star, select: (d) => d.pendingReviews },
    { key: "dashboard.pendingCoaches", to: "/coaches", icon: Dumbbell, select: (d) => d.pendingCoaches },
    { key: "dashboard.openOrders", to: "/orders", icon: ReceiptText, select: (d) => d.openOrders },
    { key: "dashboard.lowStock", to: "/catalogue/products?lowStock=1", icon: PackageX, select: (d) => d.lowStock },
    { key: "dashboard.pendingSessions", to: "/coaches/bookings?status=pending", icon: CalendarCheck, select: (d) => d.pendingSessions },
    { key: "dashboard.pendingSeats", to: "/education/enrolments?status=pending", icon: GraduationCap, select: (d) => d.pendingSeats },
    { key: "dashboard.depositsToRelease", to: "/rental/bookings?status=returned", icon: Wallet, select: (d) => d.depositsToRelease },
    { key: "dashboard.flaggedPosts", to: "/community?status=flagged", icon: Flag, select: (d) => d.flaggedPosts },
    { key: "dashboard.employersToVerify", to: "/careers/employers?status=pending", icon: Building2, select: (d) => d.employersToVerify },
    { key: "dashboard.jobsToReview", to: "/careers/jobs", icon: BriefcaseBusiness, select: (d) => d.jobsToReview },
  ];

  const chartConfig = {
    revenue: { label: t("dashboard.revenue"), color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <>
      <WelcomeBand />

      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={6}>
        {(data) => {
          const months = revenueByMonth(data.orders, Number(period));
          const thisMonth = months.at(-1)?.total ?? 0;
          const lastMonth = months.at(-2)?.total ?? 0;
          const earning = data.orders.filter(isEarning);
          const currency = data.orders[0]?.grandTotal.currency ?? "JOD";

          const ordersIn = (offset: number) => {
            const point = months.at(offset);
            if (!point) return 0;
            return data.orders.filter((order) => {
              const placed = new Date(order.placedAt);
              return (
                placed.getFullYear() === point.date.getFullYear() &&
                placed.getMonth() === point.date.getMonth()
              );
            }).length;
          };

          const completed = data.orders.filter((order) => order.status === "completed").length;
          const completion = data.orders.length > 0 ? completed / data.orders.length : 0;
          const windowTotal = months.reduce((sum, point) => sum + point.total, 0);
          const average = earning.length
            ? Math.round(revenueTotal(earning).amount / earning.length)
            : 0;
          const waiting = queues.reduce((sum, queue) => sum + queue.select(data), 0);

          const series = months.map((point) => ({
            month: month(point.date),
            revenue: point.total / 1000,
          }));

          return (
            <>
              {/* 16px inside a group, 24px between groups — the gap is what
                  makes the four metrics read as one row rather than four
                  unrelated cards. Matching the section gap would flatten it. */}
              <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/[0.04] *:data-[slot=card]:to-card *:data-[slot=card]:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-20px_rgb(4_36_26/0.25)] sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                <MetricCard
                  icon={DollarSign}
                  tone="green"
                  label={t("dashboard.revenue")}
                  count={{ value: thisMonth, format: (amount) => money({ amount, currency }) }}
                  ratio={changeRatio(thisMonth, lastMonth)}
                  claim={t("dashboard.vsPrevious")}
                />
                <MetricCard
                  icon={ReceiptText}
                  tone="gold"
                  label={t("dashboard.totalOrders")}
                  count={{ value: ordersIn(-1), format: number }}
                  ratio={changeRatio(ordersIn(-1), ordersIn(-2))}
                  claim={t("dashboard.vsPrevious")}
                />
                <MetricCard
                  icon={Users}
                  tone="teal"
                  label={t("dashboard.customers")}
                  count={{ value: data.customers, format: number }}
                  claim={t("dashboard.customersContext")}
                />
                <MetricCard
                  icon={CircleCheckBig}
                  tone="olive"
                  label={t("dashboard.completionRate")}
                  count={{ value: Math.round(completion * 100), format: (value) => `${value}%` }}
                  claim={t("dashboard.completionContext")}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card data-reveal className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>{t("dashboard.revenueTrend")}</CardTitle>
                    <CardDescription>{t("dashboard.revenueTrendHint")}</CardDescription>
                    <CardAction>
                      <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
                        <TabsList>
                          <TabsTrigger value="3">{t("dashboard.months3")}</TabsTrigger>
                          <TabsTrigger value="6">{t("dashboard.months6")}</TabsTrigger>
                          <TabsTrigger value="12">{t("dashboard.months12")}</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-2">
                      <span
                        data-figure
                        className="text-2xl font-semibold tracking-tight tabular-nums"
                      >
                        {money({ amount: windowTotal, currency })}
                      </span>
                      <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                        <TrendingUp className="size-3.5" />
                      </span>
                    </div>

                    {/*
                      The chart is a picture of the same numbers the two figures
                      below it state in words, which is what a screen reader and
                      a narrow phone get.

                      It draws itself in once when the card arrives — recharts'
                      own mount animation, slowed to match the cards' entrance —
                      and a period change redraws it, which is the chart
                      answering the tab rather than moving on its own.
                    */}
                    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
                      <AreaChart data={series} margin={{ left: 0, right: 0, top: 8 }}>
                        <defs>
                          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 4" />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={16}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Area
                          dataKey="revenue"
                          type="natural"
                          fill="url(#fillRevenue)"
                          stroke="var(--color-revenue)"
                          strokeWidth={2.5}
                          activeDot={{ r: 5, fill: "var(--brand-gold)", stroke: "var(--card)", strokeWidth: 2 }}
                          animationDuration={1100}
                          animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ChartContainer>

                    <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">{t("dashboard.avgOrder")}</dt>
                        <dd data-figure className="mt-1 font-medium">
                          {money({ amount: average, currency })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{t("dashboard.totalOrders")}</dt>
                        <dd data-figure className="mt-1 font-medium">
                          {number(data.orders.length)}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card data-reveal>
                  <CardHeader>
                    <CardTitle>{t("dashboard.needsAttention")}</CardTitle>
                    <CardDescription>{t("dashboard.needsAttentionHint")}</CardDescription>
                    <CardAction>
                      <span
                        data-figure
                        className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/12 px-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/25 ring-inset dark:text-amber-200"
                      >
                        {number(waiting)}
                      </span>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="px-2">
                    <ul>
                      {queues.map((queue) => {
                        const value = queue.select(data);
                        const QueueIcon = queue.icon;
                        return (
                          <li key={queue.key}>
                            <Link
                              to={queue.to}
                              className="group/queue flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                            >
                              <span
                                className={`grid size-7 shrink-0 place-items-center rounded-md ${
                                  value === 0
                                    ? "bg-muted text-muted-foreground/60"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                <QueueIcon className="size-3.5" />
                              </span>
                              <span className={`text-sm ${value === 0 ? "text-muted-foreground" : ""}`}>
                                {t(queue.key)}
                              </span>
                              <span
                                data-figure
                                className={`ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                                  value === 0
                                    ? "text-muted-foreground/70"
                                    : "bg-amber-500/12 text-amber-800 dark:text-amber-200"
                                }`}
                              >
                                {number(value)}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card data-reveal className="gap-0 py-0">
                <CardHeader className="border-b py-5">
                  <CardTitle>{t("dashboard.recentOrders")}</CardTitle>
                  <CardDescription>{t("dashboard.recentOrdersHint")}</CardDescription>
                  <CardAction className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      {t("action.export")}
                    </Button>
                    {/* A preview of the newest eight; the whole list is paged on Orders. */}
                    <Button asChild size="sm">
                      <Link to="/orders">{t("action.viewAll")}</Link>
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableCaption className="sr-only">{t("dashboard.recentOrders")}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("field.reference")}</TableHead>
                        <TableHead>{t("field.customer")}</TableHead>
                        <TableHead>{t("field.status")}</TableHead>
                        <TableHead>{t("field.placedAt")}</TableHead>
                        <TableHead className="text-end">{t("field.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.slice(0, 8).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link to={`/orders/${order.id}`} className="font-medium hover:underline">
                              {order.reference}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <Link
                              to={`/customers/${order.customer.id}`}
                              className="inline-flex items-center gap-2.5 hover:text-foreground"
                            >
                              <Initials name={order.customer.name} />
                              <span className="hover:underline" dir="auto">
                                {order.customer.name}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {dateTime(order.placedAt)}
                          </TableCell>
                          <TableCell data-figure className="text-end font-medium">
                            {money(order.grandTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* True only of the fixtures: against the API these are real figures. */}
              {apiConfig.dataSource === "mock" ? (
                <p className="text-xs text-muted-foreground">{t("dashboard.mockNotice")}</p>
              ) : null}
            </>
          );
        }}
      </AsyncBoundary>
    </>
  );
}

/**
 * THE WELCOME BAND: the one loud surface in the admin.
 *
 * The sign-in panel's pitch at night, cut down to a band: the deep green, the
 * court's dot grid (still), a gold floodlight in one corner and a green one in
 * the other, and the mark standing faintly at the far end. It says who is
 * working and what day it is, and it carries the one figure that matters on
 * arrival — how much is waiting on the team — with the two queues people open
 * most.
 *
 * It holds the screen's `<h1>`, so the dashboard is the one screen that does not
 * use `PageHeader`; it still has exactly one, which is the rule that component
 * exists to keep. The eyebrow above it is the screen's name.
 *
 * The waiting figure is the rail's own counts, already loaded for the badges,
 * so the band never waits for the dashboard's larger fetch.
 */
function WelcomeBand() {
  const { t } = useTranslation();
  const { number, longDate } = useFormatters();
  const { session } = useSession();
  const counts = useActionCounts();

  const hour = new Date().getHours();
  const greetingKey: TranslationKey =
    hour >= 5 && hour < 12
      ? "dashboard.greetingMorning"
      : hour >= 12 && hour < 17
        ? "dashboard.greetingAfternoon"
        : "dashboard.greetingEvening";
  const firstName = session?.user.name.split(/\s+/)[0] ?? "";
  const waiting = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <section
      aria-labelledby="dashboard-heading"
      className="relative isolate overflow-hidden rounded-2xl bg-(--brand-deep) px-6 py-7 text-white shadow-[0_24px_48px_-28px_rgb(4_36_26/0.8)] sm:px-8 sm:py-8"
    >
      <div aria-hidden="true" className="field-dots absolute inset-0 -z-10 animate-none text-white/[0.07]" />
      {/* The floodlight in the far top corner and the lit grass in the near
          bottom one, as on the sign-in panel. Radial gradients rather than
          blurred discs: a blurred gold disc over deep green spreads into an
          olive haze across half the band. Mirrored for Arabic by hand, since a
          gradient's position is not a logical property. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_100%_0%,rgb(235_201_128/0.34),transparent_38%)] rtl:bg-[radial-gradient(circle_at_0%_0%,rgb(235_201_128/0.34),transparent_38%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_100%,rgb(0_128_80/0.55),transparent_55%)] rtl:bg-[radial-gradient(circle_at_100%_100%,rgb(0_128_80/0.55),transparent_55%)]"
      />
      <img
        src="/jofit-mark.png"
        alt=""
        aria-hidden="true"
        className="absolute end-10 top-1/2 -z-10 h-36 w-auto -translate-y-1/2 opacity-[0.09] brightness-0 invert max-md:hidden"
      />

      <p className="text-sm font-medium text-(--brand-gold)">{t("dashboard.title")}</p>
      <h1 id="dashboard-heading" className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl" dir="auto">
        {t(greetingKey, { name: firstName })}
      </h1>
      <p className="mt-2 text-sm text-white/65">
        {longDate(new Date())} · {t("dashboard.description")}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.07] px-4 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
          <span data-figure className="text-2xl leading-none font-semibold text-(--brand-gold)">
            {number(waiting)}
          </span>
          <span className="text-xs leading-tight text-white/70">{t("dashboard.waitingTotal")}</span>
        </div>
        <Button
          asChild
          className="h-10 bg-(--brand-gold) px-4 text-[#1c1405] shadow-[0_8px_22px_-10px_var(--brand-gold)] hover:bg-(--brand-gold)/90"
        >
          <Link to="/orders">{t("nav.orders")}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 border-white/20 bg-white/[0.04] px-4 text-white hover:bg-white/10 hover:text-white dark:border-white/20 dark:bg-white/[0.04]"
        >
          <Link to="/quotations">{t("nav.quotations")}</Link>
        </Button>
      </div>
    </section>
  );
}

/** A customer's initials in a small green disc — a face for a row of names. */
function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
    >
      {letters}
    </span>
  );
}
