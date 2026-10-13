import type { LocalizedText } from "@/types";

/**
 * Every kind of line the storefront writes to a bell — the same list as its
 * `RawNotificationKind`. The staff team's bell receives the ones addressed to
 * the team:
 *
 *   order-placed            /orders/<id>
 *   session-requested       /coaches/bookings/<id>
 *   enrolment-requested     /education/enrolments
 *   review-submitted        /reviews
 *   quotation-received      /quotations/<id>
 *   support-message         /support/<id>
 *   employer-registered     /careers/employers/<employerId>   — a company to verify
 *   job-submitted           /careers/jobs/<jobId>             — a job to review
 *
 * The rest are the customers', coaches' and employers' own, listed so a kind
 * the storefront sends is always one this type knows.
 */
export const STAFF_NOTIFICATION_KINDS = [
  "order-placed",
  "order-status",
  "rental-status",
  "session-requested",
  "session-status",
  "enrolment-requested",
  "enrolment-status",
  "review-submitted",
  "review-moderated",
  "quotation-received",
  "support-message",
  /* careers */
  "employer-registered",
  "employer-verification",
  "job-submitted",
  "job-moderated",
  "job-application",
  "application-status",
] as const;
export type StaffNotificationKind = (typeof STAFF_NOTIFICATION_KINDS)[number];

/**
 * One line in the staff bell: something a visitor did that someone on the
 * team should act on. Staff notifications belong to the whole team, so reading
 * one clears it for everybody.
 */
export interface StaffNotification {
  readonly id: string;
  readonly kind: StaffNotificationKind;
  readonly title: LocalizedText;
  readonly body: LocalizedText;
  /** An admin route, e.g. `/orders/order-jf-20001` or `/careers/jobs/job-zarqa-coach`. */
  readonly href: string;
  readonly createdAt: string;
  /**
   * Live represents read-state as `StaffNotificationItemDto.isRead: boolean`,
   * not a timestamp — and nothing in the UI ever displays a read time (only
   * checks it for truthiness, see `notifications-menu.tsx`), so this is the
   * more honest field, not a synthetic timestamp standing in for one.
   */
  readonly isRead: boolean;
}

export interface StaffNotificationFeed {
  /** Newest first, at most 50. */
  readonly items: readonly StaffNotification[];
  readonly unreadCount: number;
}
