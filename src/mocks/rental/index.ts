import type { RentalBooking, RentalBookingStatus } from "@/features/rental";
import type { Money } from "@/types";

import { mockOrderRentalPicks, mockOrders, quoteRental, rentalEndsIn, type RentalPick } from "../orders";
import { personById } from "../people";
import { atTime, daysFromToday } from "../runtime";

export { mockRentalCategories, mockRentalItems, mockRentalLocations } from "./items";

/**
 * EVERY BOOKING COMES FROM AN ORDER.
 *
 * A hire is bought through the storefront cart like a pair of shoes, so its
 * money lives on an order line. The booking is the operational record of that
 * line — the thing the depot collects against and the deposit is released
 * from — and it is derived here from the orders fixture rather than typed
 * separately. That is what makes "open the order this booking came from" and
 * "show this customer's hires" true by construction.
 *
 * Status follows the calendar: a hire that ended is returned, one under way has
 * been collected, one still ahead is confirmed. A cancelled or unpaid order
 * carries its state onto the booking. Deposits on hires that ended at least
 * three days ago have been released; the rest are waiting, which is the queue
 * the release button clears.
 */
const jod = (amount: number): Money => ({ amount, currency: "JOD" });

function statusFor(orderStatus: string, pick: RentalPick): RentalBookingStatus {
  if (orderStatus === "cancelled" || orderStatus === "refunded") return "cancelled";
  if (orderStatus === "pending") return "pending";
  if (rentalEndsIn(pick) < 0) return "returned";
  if (pick.startsIn <= 0) return "collected";
  return "confirmed";
}

function buildBookings(): RentalBooking[] {
  const bookings: RentalBooking[] = [];

  for (const order of mockOrders) {
    const picks = mockOrderRentalPicks.get(order.id);
    if (!picks) continue;
    const person = personById(order.customer.id);

    picks.forEach((pick, index) => {
      const { item, unit, billable, rate } = quoteRental(pick.itemId, pick.length);
      const endsIn = rentalEndsIn(pick);
      const status = statusFor(order.status, pick);
      const deposit = item.deposit ? jod(item.deposit.amount * pick.quantity) : undefined;
      const released = status === "returned" && deposit && endsIn <= -3;

      bookings.push({
        id: `rb-${order.id}-${index + 1}`,
        reference: `RB-${order.reference.slice(3)}${index > 0 ? `-${index + 1}` : ""}`,
        itemId: item.id,
        itemTitle: item.title,
        customerId: person.id,
        customerName: person.name,
        customerEmail: person.email,
        period: { from: daysFromToday(pick.startsIn), to: daysFromToday(endsIn) },
        unit,
        quantity: pick.quantity,
        status,
        total: jod(rate.amount * billable * pick.quantity),
        deposit,
        depositReleasedAt: released ? atTime(endsIn + 1, 10) : undefined,
        orderId: order.id,
        orderReference: order.reference,
        audit: {
          createdAt: order.placedAt,
          createdBy: "system",
          updatedAt: released ? atTime(endsIn + 1, 10) : order.placedAt,
          updatedBy: released ? "admin-5" : "system",
        },
      });
    });
  }

  return bookings;
}

export const mockRentalBookings: RentalBooking[] = buildBookings();
