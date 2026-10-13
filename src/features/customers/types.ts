import type { Locale } from "@/i18n/locales";
import type { Address, AuditInfo, ListQuery, Money } from "@/types";

/**
 * Customers are READ-ONLY in this phase.
 *
 * Staff need to look a customer up while handling an order or a booking; editing
 * customer records, merging duplicates and handling deletion requests are
 * separate problems with legal weight (data protection) and are not designed
 * yet.
 *
 * A customer is also the one record every other domain points at: orders, hires,
 * coaching sessions, course places, reviews and community posts each carry a
 * `customerId`. The counts and value below are DERIVED from those records on
 * every read, never stored, so they cannot disagree with the screens they link
 * to. The customer screen composes the records themselves from each domain's
 * own service — this domain does not import them.
 *
 * OPEN BUSINESS DECISIONS: what staff may edit, who may see full contact
 * details, data retention, and how a deletion request is honoured.
 */
export interface CustomerPreferences {
  /** The storefront language the customer uses — the language to write to them in. */
  readonly locale: Locale;
  readonly marketingOptIn: boolean;
  readonly favouriteSportIds: readonly string[];
}

/** How much of each kind of business this person has done with the platform. */
export interface CustomerActivity {
  readonly orders: number;
  readonly rentalBookings: number;
  readonly coachBookings: number;
  readonly enrolments: number;
  readonly reviews: number;
  readonly communityPosts: number;
}

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly city: string;
  /** Live `AdminCustomerDto` has no `addresses` field at all — no source for address history. */
  readonly addresses?: readonly Address[];
  readonly preferences: CustomerPreferences;
  readonly activity: CustomerActivity;
  readonly orderCount: number;
  /**
   * Money actually taken, across every stream: paid orders (deposits excluded —
   * they are held, not earned), confirmed and delivered coaching, and paid
   * course places. Refunded and cancelled business is not value.
   */
  readonly lifetimeValue: Money;
  readonly lastOrderAt?: string;
  /** The latest thing they did anywhere on the platform. */
  readonly lastActiveAt?: string;
  readonly audit: AuditInfo;
}

/**
 * What staff may correct on a customer: contact details and preferences.
 * Customers are never deleted from the admin — their orders and bookings are
 * the business's history.
 */
export interface CustomerDraft {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly locale: CustomerPreferences["locale"];
  readonly marketingOptIn: boolean;
}

export const CUSTOMER_SORT_FIELDS = [
  "name",
  "orderCount",
  "lifetimeValue",
  "lastOrderAt",
  "createdAt",
] as const;
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

export interface CustomerListQuery extends ListQuery<CustomerSortField> {
  readonly marketingOptInOnly?: boolean;
}
