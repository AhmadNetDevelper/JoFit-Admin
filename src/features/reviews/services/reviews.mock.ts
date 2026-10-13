import { notFound, nowIso, paginate, validationFailed } from "@/lib";
import { pushToStorefront } from "@/mocks/bridge";
import { mockReviews } from "@/mocks/reviews";
import { matchesText, simulateLatency, sortRows } from "@/mocks/runtime";

import type { AdminReview, ReviewSortField } from "../types";
import type { ReviewsAdminService } from "./reviews.contract";

function selectSortValue(review: AdminReview, field: ReviewSortField): unknown {
  switch (field) {
    case "submittedAt":
      return review.submittedAt;
    case "rating":
      return review.rating;
    case "moderationStatus":
      return review.moderationStatus;
  }
}

export const mockReviewsAdminService: ReviewsAdminService = {
  async listReviews(query = {}) {
    await simulateLatency();
    const filtered = mockReviews.filter((review) => {
      if (!matchesText([review.body, review.title, review.authorName, review.target.title], query.search)) {
        return false;
      }
      if (query.moderationStatuses?.length && !query.moderationStatuses.includes(review.moderationStatus)) {
        return false;
      }
      if (query.targetTypes?.length && !query.targetTypes.includes(review.target.type)) return false;
      if (query.maxRating !== undefined && review.rating > query.maxRating) return false;
      if (query.customerId && review.customerId !== query.customerId) return false;
      if (query.targetId && review.target.id !== query.targetId) return false;
      return true;
    });
    const sorted = query.sort
      ? sortRows(filtered, (r) => selectSortValue(r, query.sort!.field), query.sort.direction)
      : sortRows(filtered, (r) => r.submittedAt, "desc");
    return paginate(sorted, query);
  },

  async getReview(id) {
    await simulateLatency();
    return mockReviews.find((review) => review.id === id) ?? null;
  },

  async moderate({ reviewId, status, note }) {
    await simulateLatency();
    if (status === "rejected" && !note?.trim()) {
      throw validationFailed({ note: "Give a reason for rejecting this review." });
    }
    const index = mockReviews.findIndex((review) => review.id === reviewId);
    const review = mockReviews[index];
    if (!review) throw notFound(`Review "${reviewId}"`);

    const updated: AdminReview = {
      ...review,
      moderationStatus: status,
      moderationNote: note?.trim() || undefined,
      /* `audit` is optional only because the live HTTP adapter has no source for
         it; every mock fixture always has one. */
      audit: { ...review.audit!, updatedAt: nowIso(), updatedBy: "admin-4" },
    };
    mockReviews[index] = updated;
    pushToStorefront("review", reviewId, { moderationStatus: status, moderationNote: updated.moderationNote });
    return updated;
  },

  async deleteReview(id) {
    await simulateLatency();
    const index = mockReviews.findIndex((review) => review.id === id);
    if (index < 0) throw notFound(`Review "${id}"`);
    mockReviews.splice(index, 1);
    /* The storefront holds the copy the dev bridge mirrors; without this the
       review would come back on the next poll. */
    pushToStorefront("review", id, {}, "delete");
  },

  async countPending() {
    await simulateLatency();
    return mockReviews.filter((review) => review.moderationStatus === "pending").length;
  },
};
