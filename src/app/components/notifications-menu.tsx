import { Bell, BriefcaseBusiness, Building2, FileSpreadsheet, Package, ReceiptText, Star, Dumbbell, CalendarCheck, ClipboardList, MessageSquareWarning } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Badge,
  Button,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { notificationsAdminService, type StaffNotificationFeed } from "@/features/notifications";
import { useFormatters, useTranslation, type TranslationKey } from "@/i18n";

import { useActionCounts } from "../use-action-counts";

/**
 * The bell: two things, in this order.
 *
 * RECENT ACTIVITY — real notifications. Every order, booking, enrolment,
 * review, quotation request and chat message a visitor sends records one for
 * the staff team; opening one marks it read for everybody. Polled every
 * fifteen seconds while the tab is visible.
 *
 * WAITING ON THE TEAM — live counts of the queues that exist anyway. These do
 * not clear when read, only when the work is done: the quotation is still
 * unanswered until someone answers it. The numbers come from
 * `ActionCountsProvider`, which also puts the counts on the sidebar.
 */
const FEED_POLL_MS = 15_000;

function useStaffFeed() {
  const [feed, setFeed] = useState<StaffNotificationFeed>({ items: [], unreadCount: 0 });
  const load = useCallback(async () => {
    try {
      setFeed(await notificationsAdminService.list());
    } catch {
      /* A bell that cannot load keeps its last state rather than showing an error. */
    }
  }, []);
  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => document.visibilityState === "visible" && void load(), FEED_POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [load]);
  const markRead = useCallback(
    async (ids?: readonly string[]) => {
      await notificationsAdminService.markRead(ids).catch(() => undefined);
      await load();
    },
    [load],
  );
  return { feed, markRead };
}
interface Queue {
  readonly key: TranslationKey;
  readonly hint: TranslationKey;
  readonly to: string;
  readonly icon: LucideIcon;
  readonly count: number;
}

export function NotificationsMenu() {
  const { t, locale } = useTranslation();
  const { number, dateTime } = useFormatters();
  const counts = useActionCounts();
  const { feed, markRead } = useStaffFeed();
  const navigate = useNavigate();

  const queues: readonly Queue[] = [
    {
      key: "dashboard.newQuotations",
      hint: "notifications.quotationsHint",
      to: "/quotations",
      icon: FileSpreadsheet,
      count: counts["/quotations"] ?? 0,
    },
    {
      key: "dashboard.pendingReviews",
      hint: "notifications.reviewsHint",
      to: "/reviews",
      icon: Star,
      count: counts["/reviews"] ?? 0,
    },
    {
      key: "dashboard.pendingCoaches",
      hint: "notifications.coachesHint",
      to: "/coaches",
      icon: Dumbbell,
      count: counts["/coaches"] ?? 0,
    },
    {
      key: "dashboard.openOrders",
      hint: "notifications.ordersHint",
      to: "/orders",
      icon: ReceiptText,
      count: counts["/orders"] ?? 0,
    },
    {
      key: "dashboard.lowStock",
      hint: "notifications.stockHint",
      to: "/catalogue/products?lowStock=1",
      icon: Package,
      count: counts["/catalogue/products"] ?? 0,
    },
    {
      key: "dashboard.pendingSessions",
      hint: "notifications.sessionsHint",
      to: "/coaches/bookings?status=pending",
      icon: CalendarCheck,
      count: counts["/coaches/bookings"] ?? 0,
    },
    {
      key: "dashboard.pendingSeats",
      hint: "notifications.seatsHint",
      to: "/education/enrolments?status=pending",
      icon: ClipboardList,
      count: counts["/education/enrolments"] ?? 0,
    },
    {
      key: "dashboard.flaggedPosts",
      hint: "notifications.communityHint",
      to: "/community?status=flagged",
      icon: MessageSquareWarning,
      count: counts["/community"] ?? 0,
    },
    {
      key: "dashboard.employersToVerify",
      hint: "notifications.employersHint",
      to: "/careers/employers?status=pending",
      icon: Building2,
      count: counts["/careers/employers"] ?? 0,
    },
    {
      key: "dashboard.jobsToReview",
      hint: "notifications.jobsHint",
      to: "/careers/jobs",
      icon: BriefcaseBusiness,
      count: counts["/careers/jobs"] ?? 0,
    },
  ];

  const waiting = queues.filter((queue) => queue.count > 0);
  const total = waiting.reduce((sum, queue) => sum + queue.count, 0) + feed.unreadCount;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          /* The count is in the accessible name, not only in the dot: a badge
             announced as "5" on its own tells a screen-reader user nothing. */
          aria-label={
            total > 0
              ? `${t("notifications.title")}: ${t("notifications.waiting", { count: number(total) })}`
              : `${t("notifications.title")}: ${t("notifications.clear")}`
          }
          title={t("notifications.title")}
        >
          <Bell />
          {total > 0 ? (
            <span
              aria-hidden="true"
              className="absolute end-1 top-1 size-2 rounded-full bg-destructive ring-2 ring-background"
            />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm leading-none font-medium">{t("notifications.title")}</h2>
          {total > 0 ? <Badge variant="secondary">{number(total)}</Badge> : null}
        </div>

        <div className="max-h-[28rem] overflow-y-auto p-2">
          <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-2">
            <h3 className="text-xs font-medium text-muted-foreground">{t("notifications.recent")}</h3>
            {feed.unreadCount > 0 ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => void markRead()}>
                {t("notifications.markAll")}
              </Button>
            ) : null}
          </div>
          {feed.items.length === 0 ? (
            <p className="px-2 pb-3 text-sm text-muted-foreground">{t("notifications.noRecent")}</p>
          ) : (
            <ul className="mb-2">
              {feed.items.slice(0, 8).map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!entry.isRead) void markRead([entry.id]);
                      navigate(entry.href);
                    }}
                    className="flex w-full cursor-pointer gap-2.5 rounded-lg px-2 py-2 text-start hover:bg-muted"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${entry.isRead ? "bg-transparent" : "bg-primary"}`}
                    />
                    <span className="min-w-0">
                      <span className={`block text-sm leading-snug ${entry.isRead ? "" : "font-semibold"}`}>
                        {entry.title[locale] || entry.title.en}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{entry.body[locale] || entry.body.en}</span>
                      <span className="block text-[11px] text-muted-foreground">{dateTime(entry.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 className="border-t px-2 pt-3 pb-2 text-xs font-medium text-muted-foreground">{t("notifications.queues")}</h3>
          {waiting.length === 0 ? (
            /* An empty bell is good news, so it says so rather than showing the
               same "nothing here" as a failed search. */
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {t("notifications.clear")}
            </p>
          ) : (
            waiting.map((queue) => (
              <Item key={queue.to} asChild size="sm" className="rounded-lg">
                <Link to={queue.to}>
                  <ItemMedia variant="icon">
                    <queue.icon />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{t(queue.key)}</ItemTitle>
                    <ItemDescription>{t(queue.hint)}</ItemDescription>
                  </ItemContent>
                  <Badge variant="secondary" data-figure>
                    {number(queue.count)}
                  </Badge>
                </Link>
              </Item>
            ))
          )}
        </div>

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/">{t("notifications.viewDashboard")}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
