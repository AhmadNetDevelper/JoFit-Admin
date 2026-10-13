import { adminListParams, httpClient, orNull } from "@/services";
import type { ListQuery, Paginated } from "@/types";

import type { CommunityComment, CommunityModerationStatus, CommunityPost, CommunityTopic } from "../types";
import type { CommunityAdminService } from "./community.contract";

const enc = encodeURIComponent;

/* ---------------------------------------------------------------------- *
 * Wire DTOs (`docs/api-live/admin.json`, tag AdminCommunity) — kept local
 * and minimal, mirroring the sibling community.mock.ts's fixture shapes.
 * ---------------------------------------------------------------------- */

/** Flat envelope every admin list endpoint answers — not the admin's own
 * nested `Paginated<T>` (`{items, meta:{...}}`). */
interface LivePage<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

function toPaginated<TDto, TItem>(page: LivePage<TDto>, map: (dto: TDto) => TItem): Paginated<TItem> {
  return {
    items: page.items.map(map),
    meta: {
      page: page.page,
      pageSize: page.pageSize,
      totalItems: page.totalCount,
      totalPages: page.totalPages,
      hasNextPage: page.hasNextPage,
      hasPreviousPage: page.hasPreviousPage,
    },
  };
}

interface AdminCommunityPostDto {
  readonly id: number;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: string;
  readonly topicId: number;
  readonly authorCustomerId: number;
  readonly authorName: string;
  readonly status: string;
  readonly moderationNote?: string | null;
  readonly reportCount: number;
  readonly likeCount: number;
  readonly commentCount: number;
  readonly createdAt: string;
}

interface AdminCommunityCommentDto {
  readonly id: number;
  readonly postId: number;
  readonly parentCommentId?: number | null;
  readonly authorCustomerId: number;
  readonly authorName: string;
  readonly body: string;
  readonly status: string;
  readonly moderationNote?: string | null;
  readonly reportCount: number;
  readonly createdAt: string;
}

interface AdminTopicDto {
  readonly id: number;
  readonly slug: string;
  readonly name: CommunityTopic["name"];
}

/* ---------------------------------------------------------------------- *
 * DTO -> domain mapping.
 * ---------------------------------------------------------------------- */

function toCommunityPost(dto: AdminCommunityPostDto): CommunityPost {
  return {
    id: String(dto.id),
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    body: dto.body,
    // Absent from the live DTO entirely — no source to map `kind` from.
    kind: undefined,
    // The live DTO has a single `topicId`, not a plural `topicIds` — wrapped
    // into a one-element array. Nothing in the admin UI needs more than one
    // topic per post (it only ever checks membership), so this is the
    // minimal, safe fix rather than widening the live contract.
    topicIds: [String(dto.topicId)],
    // Absent from the live DTO entirely.
    sportIds: [],
    customerId: String(dto.authorCustomerId),
    authorName: dto.authorName,
    createdAt: dto.createdAt,
    commentCount: dto.commentCount,
    likeCount: dto.likeCount,
    reportCount: dto.reportCount,
    moderationStatus: dto.status as CommunityModerationStatus,
    moderationNote: dto.moderationNote ?? undefined,
    // The live DTO carries only `createdAt` — no `updatedAt`/`createdBy`/
    // `updatedBy` at all (member-authored content isn't staff-attributed).
    // Not read anywhere in the admin UI today; synthesized so the shared
    // `AuditInfo` shape (used across every other admin domain) doesn't need
    // its own fields widened just for this one domain's gap.
    audit: { createdAt: dto.createdAt, createdBy: "", updatedAt: dto.createdAt, updatedBy: "" },
  };
}

function toCommunityComment(dto: AdminCommunityCommentDto): CommunityComment {
  return {
    id: String(dto.id),
    postId: String(dto.postId),
    parentId: dto.parentCommentId != null ? String(dto.parentCommentId) : null,
    customerId: String(dto.authorCustomerId),
    authorName: dto.authorName,
    body: dto.body,
    createdAt: dto.createdAt,
    // The live AdminCommunityCommentDto has no `likeCount` at all — defaults to 0.
    likeCount: 0,
    reportCount: dto.reportCount,
    moderationStatus: dto.status as CommunityModerationStatus,
    moderationNote: dto.moderationNote ?? undefined,
  };
}

function toCommunityTopic(dto: AdminTopicDto): CommunityTopic {
  // The live AdminTopicDto is {id,slug,name} only — no post count.
  return { id: String(dto.id), slug: dto.slug, name: dto.name };
}

/** Community moderation over `/v1/admin/community/*`. */
export const httpCommunityAdminService: CommunityAdminService = {
  listPosts: async (query = {}) =>
    toPaginated(
      await httpClient.get<LivePage<AdminCommunityPostDto>>("/v1/admin/community/posts", {
        query: {
          ...adminListParams(query),
          statuses: query.statuses,
          topicIds: query.topicIds,
          // The live `GET /community/posts` has no `CustomerId` parameter at
          // all — per-customer post filtering isn't supported server-side,
          // so `query.customerId` is deliberately not forwarded.
        },
        auth: true,
      }),
      toCommunityPost,
    ),
  getPost: async (id) => {
    const dto = await orNull(httpClient.get<AdminCommunityPostDto>(`/v1/admin/community/posts/${enc(id)}`, { auth: true }));
    return dto ? toCommunityPost(dto) : null;
  },
  listCommentsPage: async (postId, query: ListQuery = {}) =>
    toPaginated(
      await httpClient.get<LivePage<AdminCommunityCommentDto>>(`/v1/admin/community/posts/${enc(postId)}/comments`, {
        // The live endpoint takes only page/pageSize — no `Search` parameter
        // exists, so `query.search` is deliberately not sent (see the
        // doc-comment on `listCommentsPage` in community.contract.ts).
        query: { page: query.page, pageSize: query.pageSize },
        auth: true,
      }),
      toCommunityComment,
    ),
  listTopics: async () =>
    (await httpClient.get<AdminTopicDto[]>("/v1/admin/community/topics", { auth: true })).map(toCommunityTopic),
  moderatePost: async ({ id, ...decision }) =>
    toCommunityPost(
      await httpClient.put<AdminCommunityPostDto>(`/v1/admin/community/posts/${enc(id)}/moderation`, decision, {
        auth: true,
      }),
    ),
  moderateComment: async ({ id, ...decision }) =>
    toCommunityComment(
      await httpClient.put<AdminCommunityCommentDto>(`/v1/admin/community/comments/${enc(id)}/moderation`, decision, {
        auth: true,
      }),
    ),
  deletePost: async (id) => {
    await httpClient.delete<void>(`/v1/admin/community/posts/${enc(id)}`, { auth: true });
  },
  deleteComment: async (id) => {
    await httpClient.delete<void>(`/v1/admin/community/comments/${enc(id)}`, { auth: true });
  },
  countFlagged: async () =>
    (await httpClient.get<{ count: number }>("/v1/admin/community/flagged-count", { auth: true })).count,
};
