import type { SportId } from "@/features/sports";
import type {
  AuditInfo,
  DateRange,
  ListQuery,
  LocalizedText,
  Location,
  Media,
  MediaImage,
  Money,
  PublishStatus,
  RatingSummary,
} from "@/types";

/**
 * Rental is modelled as a booking domain, not a product domain — the same
 * decision the storefront makes, for the same reason: an availability calendar,
 * a booked period and a lifecycle that continues after payment.
 *
 * The admin adds what the storefront never sees: the physical unit count it can
 * edit, and the operational side of a booking (collection and return).
 */
export const RENTAL_UNITS = ["hour", "day", "week"] as const;
export type RentalUnit = (typeof RENTAL_UNITS)[number];

export interface RentalRate {
  readonly unit: RentalUnit;
  readonly price: Money;
  readonly minUnits: number;
  readonly maxUnits?: number;
}

export const RENTAL_CONDITIONS = ["new", "excellent", "good", "fair"] as const;

/** The most photos (and videos) one rental item can hold. */
export const RENTAL_ITEM_MAX_MEDIA = 12;
export type RentalCondition = (typeof RENTAL_CONDITIONS)[number];

/** The storefront's rental taxonomy, held in every language. */
export interface RentalCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
  readonly parentId: string | null;
  /** Live `RentalCategoryDto`/`RentalCategoryDraftRequest` have no `sportIds` at all — optional, never populated from the API. */
  readonly sportIds?: readonly SportId[];
  /** Derived, so it cannot disagree with the items that point at it. Live `RentalCategoryDto` has no `itemCount` — optional, defaults to 0 when absent. */
  readonly itemCount?: number;
  /** Live-only field (`RentalCategoryDto.image`); add a form field to edit it in a follow-up if useful. */
  readonly image?: MediaImage;
}

/** The editable part of a rental category; `itemCount` is always derived. */
export type RentalCategoryDraft = Omit<RentalCategory, "id" | "itemCount">;

/**
 * A depot units are collected from and returned to. Live `RentalDepotDto`/
 * `RentalDepotDraftRequest` only carry `{name, city, countryCode}` — `itemCount`/
 * `totalUnits` have no live source and are optional here (default 0).
 */
export interface RentalDepot extends Location {
  readonly itemCount?: number;
  readonly totalUnits?: number;
}

/** The editable part of a depot; the counts are derived from the items stocked there. */
export type RentalDepotDraft = Omit<RentalDepot, "id" | "itemCount" | "totalUnits">;

export interface RentalItem {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  /** The storefront's long description. Absent on items imported before it was edited here. */
  readonly description?: LocalizedText;
  /**
   * The photos on the storefront's hire pages, in display order: the first is
   * the cover on the item's card. At most `RENTAL_ITEM_MAX_MEDIA`; empty is
   * allowed, and the storefront then draws its category tile instead.
   */
  readonly media: readonly Media[];
  readonly status: PublishStatus;
  readonly categoryIds: readonly string[];
  /** Live `AdminRentalItemDto` has no `sportIds` at all — optional, never populated from the API. */
  readonly sportIds?: readonly SportId[];
  readonly rates: readonly RentalRate[];
  readonly deposit?: Money;
  /**
   * Live `AdminRentalItemDto` has no `location` at all (only a `depotId`) —
   * optional, never populated from the API. Could be joined from `depotId` via
   * `listDepots()` in a later pass; left as a documented gap for now.
   */
  readonly location?: Location;
  readonly condition: RentalCondition;
  readonly totalUnits: number;
  /** Units withdrawn from hire (damaged, servicing). */
  readonly unitsOutOfService: number;
  /** Read-only here: produced by customers through reviews. Live `AdminRentalItemDto` has no `rating` at all — optional, never populated from the API. */
  readonly rating?: RatingSummary;
  readonly audit: AuditInfo;
}

/**
 * The editable part of a rental item. The depot is sent as an id — the item's
 * `location` is a copy of that depot, filled in by the service — and the units
 * out of service stay behind their own command, as does everything customers
 * produce (the rating) or the system keeps (the audit).
 */
export interface RentalItemDraft {
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description?: LocalizedText;
  /** The whole gallery, in order; `[]` removes every image. */
  readonly media: readonly Media[];
  readonly status: PublishStatus;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly SportId[];
  readonly rates: readonly RentalRate[];
  readonly deposit?: Money;
  readonly depotId: string;
  readonly condition: RentalCondition;
  readonly totalUnits: number;
}

export const RENTAL_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "collected",
  "returned",
  "cancelled",
] as const;

export type RentalBookingStatus = (typeof RENTAL_BOOKING_STATUSES)[number];

/** Bookings in these states still need their item, so it cannot be deleted under them. */
export const OPEN_RENTAL_BOOKING_STATUSES: readonly RentalBookingStatus[] = [
  "pending",
  "confirmed",
  "collected",
];

/** Structural graph; the surrounding policy is an OPEN BUSINESS DECISION. */
export const RENTAL_BOOKING_TRANSITIONS: Readonly<
  Record<RentalBookingStatus, readonly RentalBookingStatus[]>
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["collected", "cancelled"],
  collected: ["returned"],
  returned: [],
  cancelled: [],
};

export function allowedBookingTransitions(
  status: RentalBookingStatus,
): readonly RentalBookingStatus[] {
  return RENTAL_BOOKING_TRANSITIONS[status];
}

export interface RentalBooking {
  readonly id: string;
  readonly reference: string;
  readonly itemId: string;
  /**
   * Denormalised for the bookings list. Live `AdminRentalBookingDto.itemTitle`
   * is a plain `string`, not localized — wrapped into `{en, ar}` with the same
   * value on read; the live API doesn't actually localize this field.
   */
  readonly itemTitle: LocalizedText;
  /** Into the customer registry — every booking belongs to someone on file. */
  readonly customerId: string;
  readonly customerName: string;
  /** Live `AdminRentalBookingDto` has no `customerEmail` at all — optional, never populated from the API. */
  readonly customerEmail?: string;
  readonly period: DateRange;
  readonly unit: RentalUnit;
  readonly quantity: number;
  /** Live-only field (`AdminRentalBookingDto.units`), alongside `quantity`; no admin-type consumer yet. */
  readonly units?: number;
  readonly status: RentalBookingStatus;
  /** Live's `subtotal` — the actual line total — not `unitPrice`. */
  readonly total: Money;
  /** Live-only extra context (`AdminRentalBookingDto.unitPrice`); no admin-type consumer yet. */
  readonly unitPrice?: Money;
  readonly deposit?: Money;
  /**
   * Set when the deposit has been returned to the customer. Live only tracks a
   * `depositReleased: boolean`, not a timestamp — left undefined when the data
   * came from the HTTP adapter (no timestamp to put here); `depositReleased`
   * below carries the live flag instead.
   */
  readonly depositReleasedAt?: string;
  /** Live-only flag (`AdminRentalBookingDto.depositReleased`) — the honest source of truth over HTTP, since no release timestamp exists live. */
  readonly depositReleased?: boolean;
  /**
   * The order this hire was paid through. A rental is checked out in the same
   * cart as shop items (the storefront's cart decision), so every booking has
   * one: the booking is the operational record, the order is the money.
   */
  readonly orderId: string;
  /** Live `AdminRentalBookingDto` has no `orderReference` at all (only `orderId`) — optional, never populated from the API. */
  readonly orderReference?: string;
  readonly audit: AuditInfo;
}

export const RENTAL_ITEM_SORT_FIELDS = ["title", "status", "totalUnits", "updatedAt"] as const;
export type RentalItemSortField = (typeof RENTAL_ITEM_SORT_FIELDS)[number];

export const RENTAL_BOOKING_SORT_FIELDS = ["reference", "from", "status", "total"] as const;
export type RentalBookingSortField = (typeof RENTAL_BOOKING_SORT_FIELDS)[number];

export type RentalItemListQuery = ListQuery<RentalItemSortField> & {
  readonly statuses?: readonly PublishStatus[];
  /** Wired to the live `CategoryIds`/`DepotIds` filters; no picker sends them yet. */
  readonly categoryIds?: readonly string[];
  readonly depotIds?: readonly string[];
};

/** Categories and depots are sorted by name, in the language the list is read in. */
export type RentalCategoryListQuery = ListQuery<"name">;
export type RentalDepotListQuery = ListQuery<"name">;

export type RentalBookingListQuery = ListQuery<RentalBookingSortField> & {
  readonly statuses?: readonly RentalBookingStatus[];
  readonly itemId?: string;
  readonly customerId?: string;
  readonly orderId?: string;
};
