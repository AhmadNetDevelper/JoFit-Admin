import type { ListQuery, Paginated } from "@/types";

import type {
  CommunityComment,
  CommunityModerationDecision,
  CommunityPost,
  CommunityPostListQuery,
  CommunityTopic,
} from "../types";

export interface CommunityAdminService {
  listPosts(query?: CommunityPostListQuery): Promise<Paginated<CommunityPost>>;
  getPost(id: string): Promise<CommunityPost | null>;
  /**
   * One page of a post's thread, oldest first, including hidden comments. An
   * unknown post has an empty thread.
   *
   * NOTE: the live `GET /community/posts/{id}/comments` endpoint takes only
   * `page`/`pageSize` — no `search` parameter exists server-side, so a
   * `query.search` here is not sent and matches nothing.
   */
  listCommentsPage(postId: string, query?: ListQuery): Promise<Paginated<CommunityComment>>;
  listTopics(): Promise<readonly CommunityTopic[]>;
  moderatePost(decision: CommunityModerationDecision): Promise<CommunityPost>;
  moderateComment(decision: CommunityModerationDecision): Promise<CommunityComment>;
  /** Removes the post and its whole thread. Hiding is the reversible alternative. */
  deletePost(id: string): Promise<void>;
  /** Removes the comment and every reply under it, and lowers the post's comment count. */
  deleteComment(id: string): Promise<void>;
  /** Posts and comments members have reported, for the dashboard and the rail. */
  countFlagged(): Promise<number>;
}
