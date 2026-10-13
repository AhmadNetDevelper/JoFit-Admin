import type { AuditInfo, ListQuery } from "@/types";

/**
 * Reviews are a supporting domain: the admin moderates reviews written about
 * products, rental items, coaches and courses, and it does not import any of
 * those features. A review points at a *typed target*, not at a product — which
 * is what keeps the dependency graph acyclic.
 */
export type ReviewableType = "product" | "rental-item" | "coach" | "course";

export interface ReviewTarget {
  readonly type: ReviewableType;
  readonly id: string;
  /** Denormalised so the queue can be read without loading four domains. */
  readonly title: string;
}

export const MODERATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export type ReviewScore = 1 | 2 | 3 | 4 | 5;

export interface AdminReview {
  readonly id: string;
  readonly target: ReviewTarget;
  /** Into the customer registry: every review is written by a signed-in customer. */
  readonly customerId: string;
  /** The display name the storefront prints ("Hussein A."). */
  readonly authorName: string;
  /** Live `AdminReviewDto` has no `authorEmail` at all — optional, never populated from the API. */
  readonly authorEmail?: string;
  readonly rating: ReviewScore;
  readonly title?: string;
  readonly body: string;
  readonly submittedAt: string;
  readonly moderationStatus: ModerationStatus;
  readonly moderationNote?: string;
  readonly isVerifiedPurchase?: boolean;
  /** Shoppers who marked it helpful, once public. */
  readonly helpfulCount: number;
  /** Live `AdminReviewDto` has no `audit` at all — optional, never populated from the API. */
  readonly audit?: AuditInfo;
}

export const REVIEW_SORT_FIELDS = ["submittedAt", "rating", "moderationStatus"] as const;
export type ReviewSortField = (typeof REVIEW_SORT_FIELDS)[number];

export interface ReviewListQuery extends ListQuery<ReviewSortField> {
  readonly moderationStatuses?: readonly ModerationStatus[];
  readonly targetTypes?: readonly ReviewableType[];
  readonly maxRating?: number;
  readonly customerId?: string;
  /** Reviews of one product, coach, course or hire item. */
  readonly targetId?: string;
}

export interface ModerationDecision {
  readonly reviewId: string;
  readonly status: Exclude<ModerationStatus, "pending">;
  /** Required on rejection. */
  readonly note?: string;
}
