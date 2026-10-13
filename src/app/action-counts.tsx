import { useEffect, useMemo, useState, type ReactNode } from "react";

import { careersAdminService } from "@/features/careers";
import { catalogueService, hasLowStock } from "@/features/catalogue";
import { coachesAdminService } from "@/features/coaches";
import { communityAdminService } from "@/features/community";
import { educationAdminService } from "@/features/education";
import { ordersService } from "@/features/orders";
import { quotationsAdminService } from "@/features/quotations";
import { reviewsAdminService } from "@/features/reviews";
import { supportAdminService } from "@/features/support";
import { useSession } from "@/features/auth";

import { ActionCountsContext, type ActionCounts } from "./action-counts-context";

/**
 * How many things are waiting for a member of staff, per screen.
 *
 * The spec calls these the operational heartbeat of the business, and they are
 * the reason the sidebar is worth looking at rather than just navigating
 * through: you can see the work without opening anything.
 *
 * ONE FETCH, TWO CONSUMERS
 * The sidebar badges and the notification bell are the same five numbers. This
 * provider owns them so the app asks each service once, rather than the bell and
 * the rail each polling the catalogue independently.
 *
 * Keyed by the route the count belongs to, so `config/navigation.ts` stays the
 * single list of screens — adding a badge to a new screen is one entry here, not
 * a change to the sidebar component.
 *
 * WHAT THESE ARE NOT
 * They are live counts of open work, derived from the domain services. Nothing
 * is pushed and nothing is marked read: there is no events table behind them.
 * When the backend arrives this becomes one endpoint — see ARCHITECTURE.md §18.
 */
/** The spec refreshes these every 60s. Slow enough to be free, fresh enough to trust. */
const REFRESH_MS = 60_000;

export function ActionCountsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [counts, setCounts] = useState<ActionCounts>({});

  useEffect(() => {
    /* Nothing to count for someone who is not signed in, and the services would
       reject anyway. The value is emptied below during render rather than here,
       so signing out clears the badges in the same paint. */
    if (!session) return;

    let active = true;

    async function load() {
      try {
        const [quotations, reviews, coaches, orders, products, sessions, seats, flagged, chats, careers] = await Promise.all([
          quotationsAdminService.countNew(),
          reviewsAdminService.countPending(),
          coachesAdminService.listCoaches({ statuses: ["pending"], pageSize: 1 }),
          ordersService.listOrders({
            statuses: ["pending", "confirmed", "processing"],
            pageSize: 1,
          }),
          catalogueService.listProducts({ pageSize: 100 }),
          coachesAdminService.listBookings({ statuses: ["pending"], pageSize: 1 }),
          educationAdminService.listEnrolments({ statuses: ["pending"], pageSize: 1 }),
          communityAdminService.countFlagged(),
          supportAdminService.countUnread(),
          /* A role without careers:read is refused; that must not blank every other badge. */
          careersAdminService.countPending().catch(() => ({ employers: 0, jobs: 0 })),
        ]);

        if (!active) return;
        setCounts({
          "/quotations": quotations,
          "/reviews": reviews,
          "/coaches": coaches.meta.totalItems,
          "/orders": orders.meta.totalItems,
          "/catalogue/products": products.items.filter(hasLowStock).length,
          "/coaches/bookings": sessions.meta.totalItems,
          "/education/enrolments": seats.meta.totalItems,
          "/community": flagged,
          "/support": chats,
          "/careers/jobs": careers.jobs,
          "/careers/employers": careers.employers,
        });
      } catch {
        /* A badge is an affordance, not a screen. If a count cannot be fetched
           the rail keeps working without it — surfacing an error here would put
           a failure message in the navigation. */
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [session]);

  const value = useMemo(() => (session ? counts : {}), [counts, session]);

  return <ActionCountsContext.Provider value={value}>{children}</ActionCountsContext.Provider>;
}
