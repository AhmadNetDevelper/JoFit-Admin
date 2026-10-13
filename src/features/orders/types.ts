import type { Address, AuditInfo, DateRange, ListQuery, Money } from "@/types";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Which status may follow which.
 *
 * This graph is *structural* — you cannot ship an order that was cancelled — and
 * encoding it stops the UI offering impossible actions. The *policy* around it
 * (who may cancel, how long a refund window stays open, whether a rental deposit
 * is released on completion) is an OPEN BUSINESS DECISION and is not encoded
 * anywhere in this codebase.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function allowedTransitions(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[status];
}

/** A line's origin, mirroring the storefront cart's two line kinds. */
export type OrderLineKind = "shop" | "rental";

export interface OrderLine {
  readonly id: string;
  readonly kind: OrderLineKind;
  readonly title: string;
  readonly description?: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly total: Money;
  /** Present only on rental lines. */
  readonly rentalPeriod?: DateRange;
  /**
   * What the line points at. Ids, not objects: the orders domain does not
   * import the catalogue or rental domains, and a line must still read
   * correctly after the product it sold has been renamed or withdrawn — which
   * is why `title` is kept as it was at the time of sale.
   */
  readonly productId?: string;
  readonly variantId?: string;
  readonly rentalItemId?: string;
  /** The rental booking this line created, for rental lines. */
  readonly rentalBookingId?: string;
}

export interface OrderCustomer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface Order {
  readonly id: string;
  readonly reference: string;
  readonly status: OrderStatus;
  readonly placedAt: string;
  readonly customer: OrderCustomer;
  readonly lines: readonly OrderLine[];
  readonly itemsSubtotal: Money;
  readonly depositsTotal: Money;
  readonly shippingTotal: Money;
  readonly taxTotal: Money;
  readonly grandTotal: Money;
  readonly shippingAddress?: Address;
  readonly audit: AuditInfo;
  /**
   * The live API's own allowed-transitions list for this order (`AdminOrderDto.nextStatuses`).
   * Not consumed anywhere yet — the UI still drives off the client-side `ORDER_TRANSITIONS`
   * graph above. Could replace it with server-authoritative transitions in a later pass.
   */
  readonly nextStatuses?: readonly OrderStatus[];
  /** Live-only field (`AdminOrderDto.fulfilment`); no admin-type consumer yet. */
  readonly fulfilment?: string;
  /** Live-only field (`AdminOrderDto.notes`); no admin-type consumer yet. */
  readonly notes?: string;
}

export const ORDER_SORT_FIELDS = ["reference", "placedAt", "status", "grandTotal"] as const;
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];

export interface OrderListQuery extends ListQuery<OrderSortField> {
  readonly statuses?: readonly OrderStatus[];
  readonly placedBetween?: DateRange;
  readonly customerId?: string;
}
