import type { SportId } from "@/features/sports";
import type { AuditInfo, ListQuery, LocalizedText } from "@/types";

/**
 * Community moderation.
 *
 * The storefront has the community's read model (topics, posts, threaded
 * comments) behind a feature flag that is still off; this is the staff side of
 * the same records. Moderation is REACTIVE, not pre-approval: a post is visible
 * the moment it is written, members report what they object to, and staff
 * decide whether it stays up. That is a different queue from reviews, which are
 * held until someone approves them, and it is modelled differently on purpose.
 *
 * Post and comment bodies are member-written, so they are never translated and
 * are rendered `dir="auto"`. Topic names are platform-authored and localized.
 *
 * OPEN BUSINESS DECISIONS: who may post, whether community identity is the same
 * account as the commerce customer (these fixtures assume it is — every author
 * is on the customer list), whether posts are indexable, and how many reports
 * hide a post automatically.
 */
export type CommunityPostKind = "discussion" | "question" | "announcement";

export const COMMUNITY_MODERATION_STATUSES = ["visible", "flagged", "hidden"] as const;
export type CommunityModerationStatus = (typeof COMMUNITY_MODERATION_STATUSES)[number];

export interface CommunityTopic {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  /** The live `AdminTopicDto` is `{id,slug,name}` only — no post count. */
  readonly postCount?: number;
}

export interface CommunityPost {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: string;
  /** Absent from the live `AdminCommunityPostDto` entirely — no source to map from. */
  readonly kind?: CommunityPostKind;
  readonly topicIds: readonly string[];
  /** Absent from the live `AdminCommunityPostDto` entirely — always empty from the HTTP adapter. */
  readonly sportIds: readonly SportId[];
  /** Into the customer registry. */
  readonly customerId: string;
  readonly authorName: string;
  readonly createdAt: string;
  readonly commentCount: number;
  readonly likeCount: number;
  /** Members who reported it. Any report moves a visible post to `flagged`. */
  readonly reportCount: number;
  readonly moderationStatus: CommunityModerationStatus;
  /** Required when hiding — the author is told why. */
  readonly moderationNote?: string;
  readonly audit: AuditInfo;
}

export interface CommunityComment {
  readonly id: string;
  readonly postId: string;
  readonly parentId: string | null;
  readonly customerId: string;
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
  /** The live `AdminCommunityCommentDto` has no `likeCount` at all (only `reportCount`) — defaults to 0. */
  readonly likeCount?: number;
  readonly reportCount: number;
  readonly moderationStatus: CommunityModerationStatus;
  readonly moderationNote?: string;
}

export const COMMUNITY_POST_SORT_FIELDS = ["createdAt", "reportCount", "likeCount"] as const;
export type CommunityPostSortField = (typeof COMMUNITY_POST_SORT_FIELDS)[number];

export interface CommunityPostListQuery extends ListQuery<CommunityPostSortField> {
  readonly statuses?: readonly CommunityModerationStatus[];
  readonly topicIds?: readonly string[];
  readonly customerId?: string;
}

/** `visible` clears the reports; `hidden` takes it down and needs a note. */
export interface CommunityModerationDecision {
  readonly id: string;
  readonly status: Exclude<CommunityModerationStatus, "flagged">;
  readonly note?: string;
}
