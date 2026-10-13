import { resolveService } from "@/services";

import type { ReviewsAdminService } from "./reviews.contract";
import { httpReviewsAdminService } from "./reviews.http";
import { mockReviewsAdminService } from "./reviews.mock";

export const reviewsAdminService = resolveService<ReviewsAdminService>("reviews", {
  mock: mockReviewsAdminService,
  http: httpReviewsAdminService,
});

export type { ReviewsAdminService } from "./reviews.contract";
