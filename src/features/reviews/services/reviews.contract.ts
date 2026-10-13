import type { Paginated } from "@/types";

import type { AdminReview, ModerationDecision, ReviewListQuery } from "../types";

export interface ReviewsAdminService {
  listReviews(query?: ReviewListQuery): Promise<Paginated<AdminReview>>;
  getReview(id: string): Promise<AdminReview | null>;
  moderate(decision: ModerationDecision): Promise<AdminReview>;
  /** For spam. A review that is only unsuitable is rejected instead, which keeps it on record. */
  deleteReview(id: string): Promise<void>;
  /** Count awaiting moderation, for the dashboard. */
  countPending(): Promise<number>;
}
