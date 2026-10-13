import { DEFAULT_LOCALE } from "@/i18n/locales";
import { localize } from "@/lib";
import { adminListParams, httpClient, orNull } from "@/services";
import type { LocalizedText, Paginated } from "@/types";

import type { AdminReview, ModerationStatus, ReviewableType, ReviewScore } from "../types";
import type { ReviewsAdminService } from "./reviews.contract";

/** What `GET/PUT /v1/admin/reviews*` actually answers — `AdminReviewDto`. */
interface AdminReviewDto {
  readonly id: number;
  readonly targetType: string;
  readonly targetId: number;
  readonly targetTitle: LocalizedText;
  readonly customerId: number;
  readonly customerName: string | null;
  readonly rating: number;
  readonly title: string | null;
  readonly body: string;
  readonly moderationStatus: string;
  readonly moderationNote: string | null;
  readonly helpfulCount: number;
  readonly submittedAt: string;
}

/**
 * `AdminReviewDto` is flat (`targetType`/`targetId`/`targetTitle`), not the
 * admin's nested `target: ReviewTarget` — rebuilt here. `targetTitle` is also
 * localized live; `ReviewTarget.title` is a single display string by design
 * (a denormalised snapshot), so it is flattened with `locale`.
 */
function toAdminReview(dto: AdminReviewDto, locale = DEFAULT_LOCALE): AdminReview {
  return {
    id: String(dto.id),
    target: {
      type: dto.targetType as ReviewableType,
      id: String(dto.targetId),
      title: localize(dto.targetTitle, locale),
    },
    customerId: String(dto.customerId),
    /* Live calls this `customerName`; the admin type's `authorName`. */
    authorName: dto.customerName ?? "",
    /* No live source at all — see AdminReview's own doc comment. */
    authorEmail: undefined,
    rating: dto.rating as ReviewScore,
    title: dto.title ?? undefined,
    body: dto.body,
    submittedAt: dto.submittedAt,
    moderationStatus: dto.moderationStatus as ModerationStatus,
    moderationNote: dto.moderationNote ?? undefined,
    /* Entirely absent from the live DTO; already optional on the admin type. */
    isVerifiedPurchase: undefined,
    helpfulCount: dto.helpfulCount,
    /* No live source at all — see AdminReview's own doc comment. */
    audit: undefined,
  };
}

/** The moderation queue over `/v1/admin/reviews`. */
export const httpReviewsAdminService: ReviewsAdminService = {
  listReviews: async (query = {}) => {
    const page = await httpClient.get<Paginated<AdminReviewDto>>("/v1/admin/reviews", {
      query: {
        ...adminListParams(query),
        moderationStatuses: query.moderationStatuses,
        targetTypes: query.targetTypes,
        /* `maxRating` and a generic `targetId` have no backing parameter on the
           live GET at all (only `MinRating` and a course-specific `CourseId`
           exist, checked docs/api-live/admin.json) — dropped rather than sent
           as silent no-ops. */
        customerId: query.customerId,
      },
      auth: true,
    });
    const locale = query.locale ?? DEFAULT_LOCALE;
    return { items: page.items.map((dto) => toAdminReview(dto, locale)), meta: page.meta };
  },
  getReview: async (id) => {
    const dto = await orNull(
      httpClient.get<AdminReviewDto>(`/v1/admin/reviews/${encodeURIComponent(id)}`, { auth: true }),
    );
    return dto ? toAdminReview(dto) : null;
  },
  moderate: async ({ reviewId, ...decision }) => {
    const dto = await httpClient.put<AdminReviewDto>(
      `/v1/admin/reviews/${encodeURIComponent(reviewId)}/moderation`,
      decision,
      { auth: true },
    );
    return toAdminReview(dto);
  },
  deleteReview: async (id) => {
    await httpClient.delete<void>(`/v1/admin/reviews/${encodeURIComponent(id)}`, { auth: true });
  },
  countPending: async () =>
    (await httpClient.get<{ count: number }>("/v1/admin/reviews/pending-count", { auth: true })).count,
};
