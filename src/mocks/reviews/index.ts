import type { AdminReview, ReviewTarget, ReviewableType } from "@/features/reviews";

import { mockProducts } from "../catalogue";
import { mockCoachBookings, mockCoaches } from "../coaches";
import { mockCourses, mockEnrolments } from "../education";
import { mockOrders } from "../orders";
import { mockPeople, personById, personByPublicName } from "../people";
import { mockRentalBookings, mockRentalItems } from "../rental";
import { atTime } from "../runtime";
import { websiteSnapshot } from "../website/snapshot";

/**
 * Reviews: what the storefront already shows, plus the queue it does not.
 *
 * The website's reviews are public, so they arrive `approved`, each matched back
 * to the customer who wrote it by the name the site prints. The reviews written
 * out below are the moderation queue — submitted, not yet judged, and so not
 * visible on the site.
 *
 * "Verified purchase" on a queued review is COMPUTED: it is true only when the
 * author has an order line, a hire, a session or a seat for the thing they are
 * reviewing. That is the question a moderator is asking, and the fixtures can
 * answer it truthfully because every domain points at the same customer list.
 */

/**
 * The storefront has one review addressed to `course-pt-foundation`, a course
 * that does not exist in its catalogue — so it can never render. It is filed
 * against the certification it describes. See the report in the admin README.
 */
const RETARGETED: Readonly<Record<string, string>> = {
  "course-pt-foundation": "course-ncsf-cpt",
};

function targetTitle(type: ReviewableType, id: string): string {
  switch (type) {
    case "product":
      return mockProducts.find((entry) => entry.id === id)?.title.en ?? id;
    case "rental-item":
      return mockRentalItems.find((entry) => entry.id === id)?.title.en ?? id;
    case "coach":
      return mockCoaches.find((entry) => entry.id === id)?.name.en ?? id;
    case "course":
      return mockCourses.find((entry) => entry.id === id)?.title.en ?? id;
  }
}

function target(type: ReviewableType, id: string): ReviewTarget {
  return { type, id, title: targetTitle(type, id) };
}

/** Did this customer actually buy, hire, book or enrol in the thing? */
function hasBought(customerId: string, type: ReviewableType, id: string): boolean {
  switch (type) {
    case "product":
      return mockOrders.some(
        (order) =>
          order.customer.id === customerId &&
          order.status === "completed" &&
          order.lines.some((line) => line.productId === id),
      );
    case "rental-item":
      return mockRentalBookings.some(
        (booking) => booking.customerId === customerId && booking.itemId === id && booking.status === "returned",
      );
    case "coach":
      return mockCoachBookings.some(
        (booking) => booking.customerId === customerId && booking.coachId === id && booking.status === "completed",
      );
    case "course":
      return mockEnrolments.some(
        (enrolment) =>
          enrolment.customerId === customerId && enrolment.courseId === id && enrolment.status !== "cancelled",
      );
  }
}

const published: AdminReview[] = websiteSnapshot.reviews.map((review) => {
  const person = personByPublicName(review.authorName) ?? mockPeople[0]!;
  const targetId = RETARGETED[review.targetId] ?? review.targetId;
  const submittedAt = `${review.createdAt}T12:00:00+03:00`;
  return {
    id: review.id,
    target: target(review.targetType, targetId),
    customerId: person.id,
    authorName: review.authorName,
    authorEmail: person.email,
    rating: review.rating,
    title: review.title,
    body: review.body,
    submittedAt,
    moderationStatus: "approved",
    isVerifiedPurchase: review.isVerified,
    helpfulCount: review.helpfulCount,
    audit: { createdAt: submittedAt, createdBy: "system", updatedAt: submittedAt, updatedBy: "admin-4" },
  };
});

interface QueuedSpec {
  readonly id: string;
  readonly customerId: string;
  readonly type: ReviewableType;
  readonly targetId: string;
  readonly rating: AdminReview["rating"];
  readonly title?: string;
  readonly body: string;
  readonly daysAgo: number;
  readonly moderationStatus?: AdminReview["moderationStatus"];
  readonly moderationNote?: string;
}

const queued: readonly QueuedSpec[] = [
  { id: "rev-q1", customerId: "cust-1", type: "product", targetId: "prod-adjustable-dumbbell", rating: 5, title: "Replaced a whole rack", body: "Dial clicks cleanly and the plates don't rattle. Worth it for a small flat.", daysAgo: 1 },
  { id: "rev-q2", customerId: "cust-4", type: "rental-item", targetId: "rent-gravel-bike", rating: 2, body: "Drivetrain was worn and the rear brake needed adjusting before I could ride.", daysAgo: 2 },
  { id: "rev-q3", customerId: "cust-3", type: "rental-item", targetId: "rent-paddleboard", rating: 5, body: "Board was clean and fully kitted. Collection took five minutes.", daysAgo: 3 },
  { id: "rev-q4", customerId: "cust-10", type: "coach", targetId: "coach-noor", rating: 4, body: "خطة التغذية كانت واضحة وسهلة التطبيق، لكن المتابعة تأخرت أحياناً", daysAgo: 2 },
  { id: "rev-q5", customerId: "cust-22", type: "course", targetId: "course-ncsf-cpt", rating: 5, body: "The practical assessment week was the most useful part by far.", daysAgo: 4 },
  { id: "rev-q6", customerId: "cust-12", type: "product", targetId: "prod-court-shoe", rating: 3, title: "مقاس صغير قليلاً", body: "الحذاء مريح لكن المقاس أصغر من المعتاد، اطلبوا مقاساً أكبر", daysAgo: 5 },
  { id: "rev-q7", customerId: "cust-26", type: "product", targetId: "prod-trail-runner", rating: 1, body: "Visit my site for cheap shoes!!!", daysAgo: 6, moderationStatus: "rejected", moderationNote: "Spam." },
  { id: "rev-q8", customerId: "cust-14", type: "coach", targetId: "coach-rania", rating: 5, title: "Sub-50 at last", body: "Six weeks of her plan and I finally broke fifty minutes. Honest about what was realistic.", daysAgo: 1 },
];

/**
 * A real queue is mostly written by people who bought the thing. The written
 * author is kept when that is true of them, and otherwise the review goes to the
 * first customer the history shows did buy it — so "verified" is earned by the
 * data, not asserted by the fixture. Spam keeps its author: spammers buy nothing.
 */
function authorFor(spec: QueuedSpec) {
  if (spec.moderationStatus === "rejected" || hasBought(spec.customerId, spec.type, spec.targetId)) {
    return personById(spec.customerId);
  }
  return mockPeople.find((person) => hasBought(person.id, spec.type, spec.targetId)) ?? personById(spec.customerId);
}

const moderation: AdminReview[] = queued.map((spec) => {
  const person = authorFor(spec);
  const submittedAt = atTime(-spec.daysAgo, 10, 5);
  return {
    id: spec.id,
    target: target(spec.type, spec.targetId),
    customerId: person.id,
    authorName: person.publicName,
    authorEmail: person.email,
    rating: spec.rating,
    title: spec.title,
    body: spec.body,
    submittedAt,
    moderationStatus: spec.moderationStatus ?? "pending",
    moderationNote: spec.moderationNote,
    isVerifiedPurchase: hasBought(person.id, spec.type, spec.targetId),
    helpfulCount: 0,
    audit: { createdAt: submittedAt, createdBy: "system", updatedAt: submittedAt, updatedBy: "system" },
  };
});

export const mockReviews: AdminReview[] = [...moderation, ...published];
