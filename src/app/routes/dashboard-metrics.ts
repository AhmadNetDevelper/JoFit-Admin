import type { Order, OrderStatus } from "@/features/orders";
import type { Money } from "@/types";

/**
 * Turns the lists the domains return into the handful of numbers the dashboard
 * draws.
 *
 * This lives beside the screen rather than inside a feature because it is not a
 * domain rule — it is a question this one screen asks across several domains.
 * `features/orders` should not grow a "revenue by month" function that only the
 * dashboard calls.
 *
 * IT IS ALSO TEMPORARY. Aggregating in the browser means fetching every order to
 * add them up, which works against a fixture set and will not work against a
 * real catalogue. When the backend exists these become one endpoint, and this
 * file is deleted. See ARCHITECTURE.md §18 — there is no analytics domain yet,
 * and this is deliberately not pretending to be one.
 */

/** Orders that never took money are excluded: a refund is not revenue. */
const EARNING_STATUSES: readonly OrderStatus[] = [
  "confirmed",
  "processing",
  "shipped",
  "completed",
];

export interface MonthPoint {
  /** `2026-09`, so it sorts and can be formatted in either language. */
  readonly key: string;
  readonly date: Date;
  readonly total: number;
}

export function isEarning(order: Order): boolean {
  return EARNING_STATUSES.includes(order.status);
}

export function revenueTotal(orders: readonly Order[]): Money {
  const amount = orders
    .filter(isEarning)
    .reduce((sum, order) => sum + order.grandTotal.amount, 0);
  return { amount, currency: orders[0]?.grandTotal.currency ?? "JOD" };
}

/**
 * Revenue per calendar month, oldest first, with empty months kept.
 *
 * Dropping a month with no orders would draw a line straight from August to
 * October and hide that nothing happened in September — the one thing a trend is
 * supposed to show.
 */
export function revenueByMonth(orders: readonly Order[], months: number): readonly MonthPoint[] {
  const now = new Date();
  const points: MonthPoint[] = [];

  for (let back = months - 1; back >= 0; back -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
    points.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      date,
      total: 0,
    });
  }

  const index = new Map(points.map((point) => [point.key, point]));
  for (const order of orders) {
    if (!isEarning(order)) continue;
    const placed = new Date(order.placedAt);
    const key = `${placed.getFullYear()}-${String(placed.getMonth() + 1).padStart(2, "0")}`;
    const point = index.get(key);
    if (point) index.set(key, { ...point, total: point.total + order.grandTotal.amount });
  }

  return points.map((point) => index.get(point.key) ?? point);
}

/**
 * How the last two comparable periods differ, as a percentage.
 *
 * Returns `undefined` rather than 0 when there is nothing to compare against:
 * "up 0%" and "we have no previous month" are different statements, and only one
 * of them should be drawn as a trend.
 */
export function changeRatio(current: number, previous: number): number | undefined {
  if (previous <= 0) return undefined;
  return (current - previous) / previous;
}

export function countByStatus(orders: readonly Order[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const order of orders) counts[order.status] = (counts[order.status] ?? 0) + 1;
  return counts;
}

/** Orders per weekday, Sunday first — the Jordanian working week starts there. */
export function ordersByWeekday(orders: readonly Order[]): readonly number[] {
  const days = [0, 0, 0, 0, 0, 0, 0];
  for (const order of orders) {
    const day = new Date(order.placedAt).getDay();
    days[day] = (days[day] ?? 0) + 1;
  }
  return days;
}
