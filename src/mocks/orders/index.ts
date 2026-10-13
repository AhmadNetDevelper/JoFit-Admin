import type { Order, OrderLine, OrderStatus } from "@/features/orders";
import type { AuditInfo, Money } from "@/types";

import { mockProducts } from "../catalogue";
import { mockPeople, personAddress, personById, personRef } from "../people";
import { mockRentalItems } from "../rental/items";
import { atTime, daysFromToday, seededRandom } from "../runtime";

/**
 * A year of trading, built from the real catalogue and the real customer list.
 *
 * Every shop line names a product and variant that exist in `mocks/catalogue`,
 * at that variant's price; every rental line names a hire item from
 * `mocks/rental`, priced from its own rate card. Rental bookings are then
 * DERIVED from these rental lines (see `mocks/rental/index.ts`), so a booking
 * always has the order that paid for it, and the customer screen can walk from
 * a person to their orders to the bookings those orders created.
 *
 * Dates are relative to today, so the dashboard's "this month" always has a
 * this month. The generator is seeded: the same history on every reload.
 *
 * Totals follow one rule, the one the first hand-written orders used: tax at 16%
 * of the items, a flat delivery charge when anything ships, and refundable
 * deposits carried in the grand total but labelled separately — a deposit is
 * money held, not revenue. The real rules are an OPEN BUSINESS DECISION.
 */
const jod = (amount: number): Money => ({ amount, currency: "JOD" });
const audit = (at: string): AuditInfo => ({
  createdAt: at,
  createdBy: "system",
  updatedAt: at,
  updatedBy: "system",
});

const TAX_RATE = 0.16;
const DELIVERY = 3_000;

export interface ShopPick {
  readonly variantId: string;
  readonly quantity: number;
}

export interface RentalPick {
  readonly itemId: string;
  /** Start, in days from today. Negative is in the past. */
  readonly startsIn: number;
  /** Days for day/week hires; hours for hourly hires. */
  readonly length: number;
  readonly quantity: number;
}

function findVariant(variantId: string) {
  for (const product of mockProducts) {
    const variant = product.variants.find((entry) => entry.id === variantId);
    if (variant) return { product, variant };
  }
  throw new Error(`Order fixture points at unknown variant "${variantId}"`);
}

function findRentalItem(itemId: string) {
  const item = mockRentalItems.find((entry) => entry.id === itemId);
  if (!item) throw new Error(`Order fixture points at unknown rental item "${itemId}"`);
  return item;
}

/**
 * How a hire is billed: an hourly item by the hour, otherwise by the week when
 * the hire is a whole number of weeks and the item has a weekly rate, else by
 * the day. Mirrors the storefront's quote closely enough to look right; the
 * real calculation is the rental service's.
 */
export function quoteRental(itemId: string, length: number) {
  const item = findRentalItem(itemId);
  const hourly = item.rates.find((rate) => rate.unit === "hour");
  if (hourly) return { item, unit: "hour" as const, billable: length, rate: hourly.price };
  const weekly = item.rates.find((rate) => rate.unit === "week");
  if (weekly && length % 7 === 0) {
    return { item, unit: "week" as const, billable: length / 7, rate: weekly.price };
  }
  const daily = item.rates.find((rate) => rate.unit === "day") ?? item.rates[0]!;
  return { item, unit: daily.unit, billable: length, rate: daily.price };
}

/** The last day a hire covers. An hourly booking starts and ends on one day. */
export function rentalEndsIn(pick: RentalPick): number {
  const { unit } = quoteRental(pick.itemId, pick.length);
  return unit === "hour" ? pick.startsIn : pick.startsIn + pick.length - 1;
}

/** An order's status follows its hire dates when it contains a hire. */
function rentalOrderStatus(picks: readonly RentalPick[]): OrderStatus {
  const lastEnd = Math.max(...picks.map(rentalEndsIn));
  const firstStart = Math.min(...picks.map((pick) => pick.startsIn));
  if (lastEnd < 0) return "completed";
  if (firstStart <= 0) return "processing";
  return "confirmed";
}

interface OrderSpec {
  readonly id: string;
  readonly reference: string;
  readonly customerId: string;
  readonly daysAgo: number;
  readonly hour: number;
  readonly minute: number;
  readonly shop: readonly ShopPick[];
  readonly rental: readonly RentalPick[];
  /** Omitted: derived from the hire dates, or from the order's age. */
  readonly status?: OrderStatus;
}

function buildOrder(spec: OrderSpec, fallbackStatus: OrderStatus): Order {
  const person = personById(spec.customerId);
  const placedAt = atTime(-spec.daysAgo, spec.hour, spec.minute);

  const shopLines: OrderLine[] = spec.shop.map((pick, index) => {
    const { product, variant } = findVariant(pick.variantId);
    return {
      id: `${spec.id}-l${index + 1}`,
      kind: "shop",
      // The title as the customer saw it, in the language they bought in.
      title: product.title[person.locale],
      description: product.variants.length > 1 ? variant.title : undefined,
      quantity: pick.quantity,
      unitPrice: variant.price,
      total: jod(variant.price.amount * pick.quantity),
      productId: product.id,
      variantId: variant.id,
    };
  });

  let deposits = 0;
  const rentalLines: OrderLine[] = spec.rental.map((pick, index) => {
    const { item, billable, rate } = quoteRental(pick.itemId, pick.length);
    const perUnit = rate.amount * billable;
    deposits += (item.deposit?.amount ?? 0) * pick.quantity;
    return {
      id: `${spec.id}-r${index + 1}`,
      kind: "rental",
      title: item.title[person.locale],
      quantity: pick.quantity,
      unitPrice: jod(perUnit),
      total: jod(perUnit * pick.quantity),
      rentalPeriod: { from: daysFromToday(pick.startsIn), to: daysFromToday(rentalEndsIn(pick)) },
      rentalItemId: item.id,
      rentalBookingId: `rb-${spec.id}-${index + 1}`,
    };
  });

  const lines = [...shopLines, ...rentalLines];
  const itemsSubtotal = lines.reduce((sum, line) => sum + line.total.amount, 0);
  const shipping = shopLines.length > 0 ? DELIVERY : 0;
  const tax = Math.round(itemsSubtotal * TAX_RATE);

  return {
    id: spec.id,
    reference: spec.reference,
    status: spec.status ?? (spec.rental.length > 0 ? rentalOrderStatus(spec.rental) : fallbackStatus),
    placedAt,
    customer: personRef(person.id),
    lines,
    itemsSubtotal: jod(itemsSubtotal),
    depositsTotal: jod(deposits),
    shippingTotal: jod(shipping),
    taxTotal: jod(tax),
    grandTotal: jod(itemsSubtotal + deposits + shipping + tax),
    shippingAddress: shopLines.length > 0 ? personAddress(person) : undefined,
    audit: audit(placedAt),
  };
}

/*
 * The five orders screens and docs open by id (`/orders/order-1`). Written out
 * so what they contain is readable in review; the rest is generated below.
 */
const writtenSpecs: readonly OrderSpec[] = [
  {
    id: "order-1", reference: "JF-10241", customerId: "cust-1", daysAgo: 1, hour: 9, minute: 12, status: "pending",
    shop: [{ variantId: "var-match-football-5", quantity: 2 }, { variantId: "var-training-tee-m-black", quantity: 1 }],
    rental: [],
  },
  {
    id: "order-2", reference: "JF-10240", customerId: "cust-2", daysAgo: 3, hour: 17, minute: 40, status: "shipped",
    shop: [{ variantId: "var-trail-runner-42", quantity: 1 }],
    rental: [],
  },
  {
    id: "order-3", reference: "JF-10238", customerId: "cust-3", daysAgo: 5, hour: 11, minute: 5,
    shop: [],
    rental: [{ itemId: "rent-paddleboard", startsIn: 3, length: 2, quantity: 2 }],
  },
  {
    id: "order-4", reference: "JF-10233", customerId: "cust-1", daysAgo: 15, hour: 14, minute: 22, status: "completed",
    shop: [{ variantId: "var-adjustable-dumbbell-default", quantity: 1 }],
    rental: [],
  },
  {
    id: "order-5", reference: "JF-10229", customerId: "cust-4", daysAgo: 20, hour: 8, minute: 47, status: "cancelled",
    shop: [{ variantId: "var-indoor-basketball-7", quantity: 1 }],
    rental: [],
  },
  /*
   * Hires at every point of their life, so each rental queue has work in it
   * today: one not yet paid for, one ahead, one out with the customer, and two
   * just back with their deposits still held.
   */
  {
    id: "order-6", reference: "JF-10243", customerId: "cust-7", daysAgo: 0, hour: 8, minute: 5, status: "pending",
    shop: [],
    rental: [{ itemId: "rent-road-bike", startsIn: 4, length: 3, quantity: 1 }],
  },
  {
    id: "order-7", reference: "JF-10242", customerId: "cust-21", daysAgo: 6, hour: 19, minute: 30,
    shop: [],
    rental: [{ itemId: "rent-sea-kayak", startsIn: -2, length: 4, quantity: 2 }],
  },
  {
    id: "order-8", reference: "JF-10239", customerId: "cust-5", daysAgo: 4, hour: 13, minute: 15,
    shop: [],
    rental: [{ itemId: "rent-indoor-court", startsIn: 1, length: 2, quantity: 1 }],
  },
  {
    id: "order-9", reference: "JF-10236", customerId: "cust-3", daysAgo: 9, hour: 10, minute: 0,
    shop: [{ variantId: "var-goggles-smoke", quantity: 1 }],
    rental: [
      { itemId: "rent-paddleboard", startsIn: -3, length: 2, quantity: 1 },
      { itemId: "rent-wetsuit", startsIn: -3, length: 2, quantity: 1 },
    ],
  },
  {
    id: "order-10", reference: "JF-10235", customerId: "cust-4", daysAgo: 12, hour: 16, minute: 45,
    shop: [],
    rental: [{ itemId: "rent-gravel-bike", startsIn: -4, length: 3, quantity: 1 }],
  },
];

/* ------------------------------------------------------------ generation */

/** Variants that can actually be sold today — nothing out of stock or unreleased. */
const SELLABLE = mockProducts.flatMap((product) =>
  product.variants.filter((variant) => variant.stockOnHand > 0).map((variant) => variant.id),
);

const HIRE_LENGTH: Readonly<Record<string, readonly number[]>> = {
  hour: [1, 2, 2, 3],
  day: [1, 2, 3, 4, 7],
  week: [7, 14],
};

/** How far through its life an order of a given age usually is. */
function statusForAge(daysAgo: number, roll: number): OrderStatus {
  if (roll > 0.94) return "cancelled";
  if (daysAgo <= 1) return roll > 0.5 ? "pending" : "confirmed";
  if (daysAgo <= 3) return roll > 0.5 ? "processing" : "confirmed";
  if (daysAgo <= 6) return roll > 0.4 ? "shipped" : "processing";
  if (roll > 0.9) return "refunded";
  return "completed";
}

function generateSpecs(count: number): OrderSpec[] {
  const random = seededRandom(20260919);
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
  const specs: OrderSpec[] = [];

  for (let index = 0; index < count; index += 1) {
    /* Denser recently, thinning out over the year — a shop that is growing. */
    const daysAgo = 2 + Math.floor(Math.pow(index / count, 1.35) * 360 + random() * 3);
    const eligible = mockPeople.filter((person) => person.joinedDaysAgo >= daysAgo);
    const customer = pick(eligible.length > 0 ? eligible : mockPeople);

    const isHire = random() < 0.2;
    const shop: ShopPick[] = [];
    const rental: RentalPick[] = [];

    if (isHire) {
      const item = pick(mockRentalItems);
      const unit = item.rates.find((rate) => rate.unit === "hour") ? "hour" : "day";
      const length = pick(HIRE_LENGTH[unit]!);
      /* Hires are booked a few days to a fortnight ahead of the start. */
      const startsIn = -daysAgo + 2 + Math.floor(random() * 12);
      const quantity = Math.max(1, Math.min(item.totalUnits, 1 + Math.floor(random() * 2)));
      rental.push({ itemId: item.id, startsIn, length, quantity });
    } else {
      const lineCount = 1 + Math.floor(random() * 2.4);
      const chosen = new Set<string>();
      while (chosen.size < lineCount) chosen.add(pick(SELLABLE));
      for (const variantId of chosen) {
        shop.push({ variantId, quantity: 1 + Math.floor(random() * random() * 3) });
      }
    }

    specs.push({
      id: `order-g${index}`,
      reference: `JF-1${(228 - index).toString().padStart(4, "0")}`,
      customerId: customer.id,
      daysAgo,
      hour: 8 + Math.floor(random() * 13),
      minute: Math.floor(random() * 60),
      shop,
      rental,
      status: isHire ? undefined : statusForAge(daysAgo, random()),
    });
  }

  return specs;
}

const allSpecs = [...writtenSpecs, ...generateSpecs(96)];

export const mockOrders: Order[] = allSpecs.map((spec) => buildOrder(spec, "completed"));

/** The rental picks behind each order, for `mocks/rental` to derive bookings from. */
export const mockOrderRentalPicks: ReadonlyMap<string, readonly RentalPick[]> = new Map(
  allSpecs.filter((spec) => spec.rental.length > 0).map((spec) => [spec.id, spec.rental]),
);
