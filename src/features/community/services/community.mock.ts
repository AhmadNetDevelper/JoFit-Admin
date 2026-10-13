import { notFound, nowIso, paginate, validationFailed } from "@/lib";
import { mockCommunityComments, mockCommunityPosts, mockCommunityTopics } from "@/mocks/community";
import { matchesAny, matchesText, simulateLatency, sortRows } from "@/mocks/runtime";

import type {
  CommunityComment,
  CommunityModerationDecision,
  CommunityPost,
  CommunityPostSortField,
} from "../types";
import type { CommunityAdminService } from "./community.contract";

function selectSortValue(post: CommunityPost, field: CommunityPostSortField): unknown {
  switch (field) {
    case "createdAt":
      return post.createdAt;
    case "reportCount":
      return post.reportCount;
    case "likeCount":
      return post.likeCount;
  }
}

/** Hiding needs a reason — the member is told why their post came down. */
function validateDecision(decision: CommunityModerationDecision): void {
  if (decision.status === "hidden" && !decision.note?.trim()) {
    throw validationFailed({ note: "Give a reason so the member can be told why." });
  }
}

/** Removes the matching comments in place (other adapters hold the same array) and says how many went. */
function removeComments(match: (comment: CommunityComment) => boolean): number {
  const before = mockCommunityComments.length;
  const kept = mockCommunityComments.filter((comment) => !match(comment));
  mockCommunityComments.splice(0, mockCommunityComments.length, ...kept);
  return before - kept.length;
}

export const mockCommunityAdminService: CommunityAdminService = {
  async listPosts(query = {}) {
    await simulateLatency();
    const filtered = mockCommunityPosts.filter((post) => {
      if (!matchesText([post.title, post.body, post.authorName], query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(post.moderationStatus)) return false;
      if (!matchesAny([...post.topicIds], query.topicIds)) return false;
      if (query.customerId && post.customerId !== query.customerId) return false;
      return true;
    });
    const sorted = query.sort
      ? sortRows(filtered, (p) => selectSortValue(p, query.sort!.field), query.sort.direction)
      : sortRows(filtered, (p) => p.createdAt, "desc");
    return paginate(sorted, query);
  },

  async getPost(id) {
    await simulateLatency();
    return mockCommunityPosts.find((post) => post.id === id) ?? null;
  },

  async listCommentsPage(postId, query = {}) {
    await simulateLatency();
    const thread = mockCommunityComments.filter(
      (comment) => comment.postId === postId && matchesText([comment.body, comment.authorName], query.search),
    );
    return paginate(sortRows(thread, (comment) => comment.createdAt, "asc"), query);
  },

  async listTopics() {
    await simulateLatency();
    // Counted on each read, so a deleted post leaves its topics' counts right.
    return mockCommunityTopics.map((topic) => ({
      ...topic,
      postCount: mockCommunityPosts.filter((post) => post.topicIds.includes(topic.id)).length,
    }));
  },

  async moderatePost(decision) {
    await simulateLatency();
    validateDecision(decision);
    const index = mockCommunityPosts.findIndex((post) => post.id === decision.id);
    const post = mockCommunityPosts[index];
    if (!post) throw notFound(`Post "${decision.id}"`);
    const updated: CommunityPost = {
      ...post,
      moderationStatus: decision.status,
      // Keeping a post up is a ruling on the reports, so they are cleared.
      reportCount: decision.status === "visible" ? 0 : post.reportCount,
      moderationNote: decision.note?.trim() || undefined,
      audit: { ...post.audit, updatedAt: nowIso(), updatedBy: "admin-4" },
    };
    mockCommunityPosts[index] = updated;
    return updated;
  },

  async moderateComment(decision) {
    await simulateLatency();
    validateDecision(decision);
    const index = mockCommunityComments.findIndex((comment) => comment.id === decision.id);
    const comment = mockCommunityComments[index];
    if (!comment) throw notFound(`Comment "${decision.id}"`);
    const updated: CommunityComment = {
      ...comment,
      moderationStatus: decision.status,
      reportCount: decision.status === "visible" ? 0 : comment.reportCount,
      moderationNote: decision.note?.trim() || undefined,
    };
    mockCommunityComments[index] = updated;
    return updated;
  },

  async deletePost(id) {
    await simulateLatency();
    const index = mockCommunityPosts.findIndex((post) => post.id === id);
    if (index < 0) throw notFound(`Post "${id}"`);
    mockCommunityPosts.splice(index, 1);
    removeComments((comment) => comment.postId === id);
  },

  async deleteComment(id) {
    await simulateLatency();
    const comment = mockCommunityComments.find((entry) => entry.id === id);
    if (!comment) throw notFound(`Comment "${id}"`);
    /* Replies go with it: a reply to nothing reads as a non sequitur. */
    const doomed = new Set([id]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const entry of mockCommunityComments) {
        if (entry.parentId && doomed.has(entry.parentId) && !doomed.has(entry.id)) {
          doomed.add(entry.id);
          grew = true;
        }
      }
    }
    const removed = removeComments((entry) => doomed.has(entry.id));
    const postIndex = mockCommunityPosts.findIndex((post) => post.id === comment.postId);
    const post = mockCommunityPosts[postIndex];
    if (post) {
      mockCommunityPosts[postIndex] = { ...post, commentCount: Math.max(0, post.commentCount - removed) };
    }
  },

  async countFlagged() {
    await simulateLatency();
    return (
      mockCommunityPosts.filter((post) => post.moderationStatus === "flagged").length +
      mockCommunityComments.filter((comment) => comment.moderationStatus === "flagged").length
    );
  },
};
