import type { Customer } from "@/features/customers";

import { mockCoachBookings } from "../coaches";
import { mockCommunityPosts } from "../community";
import { mockEnrolments } from "../education";
import { mockOrders } from "../orders";
import { mockPeople, personAddress } from "../people";
import { mockRentalBookings } from "../rental";
import { mockReviews } from "../reviews";
import { atTime } from "../runtime";

/**
 * Customers, assembled from the registry and everything that points at it.
 *
 * `buildCustomers()` is called on every read rather than once at load, because
 * the arrays it counts are mutated by the other mock adapters: cancel an order
 * and the customer's value drops on the next visit, exactly as it would against
 * a real database.
 */
const EARNING_ORDER = new Set(["confirmed", "processing", "shipped", "completed"]);
const EARNING_SESSION = new Set(["confirmed", "completed"]);
const EARNING_SEAT = new Set(["active", "completed"]);

const latest = (dates: readonly (string | undefined)[]): string | undefined =>
  dates.filter((date): date is string => Boolean(date)).sort().at(-1);

export function buildCustomers(): Customer[] {
  return mockPeople.map((person) => {
    const orders = mockOrders.filter((order) => order.customer.id === person.id);
    const hires = mockRentalBookings.filter((booking) => booking.customerId === person.id);
    const sessions = mockCoachBookings.filter((booking) => booking.customerId === person.id);
    const seats = mockEnrolments.filter((enrolment) => enrolment.customerId === person.id);
    const reviews = mockReviews.filter((review) => review.customerId === person.id);
    const posts = mockCommunityPosts.filter((post) => post.customerId === person.id);

    const value =
      orders
        .filter((order) => EARNING_ORDER.has(order.status))
        .reduce((sum, order) => sum + order.grandTotal.amount - order.depositsTotal.amount, 0) +
      sessions
        .filter((booking) => EARNING_SESSION.has(booking.status))
        .reduce((sum, booking) => sum + booking.total.amount, 0) +
      seats
        .filter((enrolment) => EARNING_SEAT.has(enrolment.status))
        .reduce((sum, enrolment) => sum + enrolment.amountPaid.amount, 0);

    const lastOrderAt = latest(orders.map((order) => order.placedAt));
    const address = personAddress(person);
    const joinedAt = atTime(-person.joinedDaysAgo, 12);

    return {
      id: person.id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      city: person.city,
      addresses: address ? [address] : [],
      preferences: {
        locale: person.locale,
        marketingOptIn: person.marketingOptIn,
        favouriteSportIds: person.favouriteSportIds,
      },
      activity: {
        orders: orders.length,
        rentalBookings: hires.length,
        coachBookings: sessions.length,
        enrolments: seats.length,
        reviews: reviews.length,
        communityPosts: posts.length,
      },
      orderCount: orders.length,
      lifetimeValue: { amount: value, currency: "JOD" },
      lastOrderAt,
      lastActiveAt: latest([
        lastOrderAt,
        ...sessions.map((booking) => booking.audit.createdAt),
        ...seats.map((enrolment) => enrolment.enrolledAt),
        ...reviews.map((review) => review.submittedAt),
        ...posts.map((post) => post.createdAt),
      ]),
      audit: { createdAt: joinedAt, createdBy: "system", updatedAt: joinedAt, updatedBy: "system" },
    };
  });
}
