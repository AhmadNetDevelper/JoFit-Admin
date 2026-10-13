import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/crud";
import { ListEmpty, PaginationControls } from "@/components/data-table";
import { AsyncBoundary, StateMessage, useNotice } from "@/components/feedback";
import { Button, PageHeader, StatusBadge } from "@/components/ui";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  communityAdminService,
  type CommunityComment,
  type CommunityModerationStatus,
} from "@/features/community";
import { useAsyncAction, useAsyncData } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { BackLink, CustomerLink, Section } from "../../components/record-parts";
import { TransitionActions } from "../../components/transition-actions";

type Decision = Exclude<CommunityModerationStatus, "flagged">;

/** Comments per page of a thread. */
const COMMENTS_PAGE_SIZE = 10;

/** What a moderator can do from where a post or comment is now. */
function nextDecisions(status: CommunityModerationStatus): readonly Decision[] {
  switch (status) {
    case "flagged":
      return ["visible", "hidden"];
    case "visible":
      return ["hidden"];
    case "hidden":
      return ["visible"];
  }
}

function CommentRow({
  comment,
  onChanged,
  onDelete,
}: {
  comment: CommunityComment;
  onChanged: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { dateTime, number } = useFormatters();
  const canModerate = usePermission("community:moderate");
  const moderate = useAsyncAction(
    (input: { status: Decision; note?: string }) =>
      communityAdminService.moderateComment({ id: comment.id, ...input }),
    { onSuccess: onChanged },
  );

  return (
    <li className={`py-4 first:pt-0 last:pb-0 ${comment.moderationStatus === "hidden" ? "opacity-60" : ""}`}>
      <div className="mb-1 flex flex-wrap items-center gap-3 text-sm">
        <CustomerLink id={comment.customerId} name={comment.authorName} />
        <span className="text-muted-foreground">{dateTime(comment.createdAt)}</span>
        <StatusBadge status={comment.moderationStatus} />
        {comment.reportCount > 0 ? (
          <span className="text-xs font-semibold text-destructive">
            {t("community.reportCount", { count: number(comment.reportCount) })}
          </span>
        ) : null}
        {canModerate ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ms-auto text-destructive"
            aria-label={`${t("crud.delete")} — ${comment.authorName}`}
            onClick={onDelete}
          >
            <Trash2 /> {t("crud.delete")}
          </Button>
        ) : null}
      </div>
      <p className="mb-3 max-w-prose text-sm" dir="auto">
        {comment.body}
      </p>
      <TransitionActions
        next={nextDecisions(comment.moderationStatus)}
        needsNote={(status) => status === "hidden"}
        onRun={(status, note) => void moderate.run({ status, note })}
        disabled={!canModerate}
        pending={moderate.isPending}
        error={moderate.error}
        fieldError={moderate.fieldErrors?.note}
        emptyLabel=""
      />
    </li>
  );
}

/**
 * The thread under a post, a page at a time from the API, oldest first. The
 * page is this section's own state, not the URL's: it belongs to this post,
 * and opening another post starts it again from the top (the parent keys it).
 */
function PostComments({ postId }: { postId: string }) {
  const { t } = useTranslation();
  const { number } = useFormatters();
  const notice = useNotice();
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<CommunityComment | null>(null);
  const state = useAsyncData(
    () => communityAdminService.listCommentsPage(postId, { page, pageSize: COMMENTS_PAGE_SIZE }),
    [postId, page],
  );
  const total = state.data?.meta.totalItems;

  return (
    <Section
      id="comments"
      title={total === undefined ? t("community.comments") : `${t("community.comments")} (${number(total)})`}
    >
      <AsyncBoundary state={state} pendingLabel={t("state.loading")} pendingRows={3}>
        {(comments) => (
          <div>
            {comments.items.length === 0 ? (
              <ListEmpty label={t("community.noComments")} />
            ) : (
              <ul className="divide-y divide-border">
                {comments.items.map((comment) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    onChanged={state.refetch}
                    onDelete={() => setDeleting(comment)}
                  />
                ))}
              </ul>
            )}
            {/* A deleted last comment can leave the page past the end; the API
                answers the last page, and the pager follows what it answered. */}
            <div className="mt-4 border-t pt-4">
              <PaginationControls meta={comments.meta} onPageChange={setPage} />
            </div>
          </div>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("community.deleteCommentTitle", { name: deleting.authorName }) : ""}
        description={t("community.deleteCommentBody")}
        onConfirm={async () => {
          if (!deleting) return;
          await communityAdminService.deleteComment(deleting.id);
          notice.success(t("community.commentDeleted"));
          state.refetch();
        }}
      />
    </Section>
  );
}

/**
 * A thread as members read it, with the moderation controls beside each part.
 * Hidden comments stay in the thread, dimmed, so a moderator can see what was
 * taken down and why the conversation reads the way it does.
 */
export function CommunityPostRoute() {
  const { postId = "" } = useParams();
  const { t } = useTranslation();
  const { dateTime, number } = useFormatters();
  const navigate = useNavigate();
  const notice = useNotice();
  const canModerate = usePermission("community:moderate");
  const [deletingPost, setDeletingPost] = useState(false);

  /* The post alone: its thread is paged, and loads in its own section below. */
  const state = useAsyncData(async () => {
    const post = await communityAdminService.getPost(postId);
    return post ? { post } : null;
  }, [postId]);

  const moderate = useAsyncAction(
    (input: { status: Decision; note?: string }) =>
      communityAdminService.moderatePost({ id: postId, ...input }),
    { onSuccess: () => state.refetch() },
  );

  return (
    <RequirePermission permission="community:moderate">
      <BackLink to="/community" />
      <AsyncBoundary state={state} pendingLabel={t("state.loading")}>
        {(data) => {
          if (!data) return <StateMessage tone="error" title={t("error.not-found")} />;
          const { post } = data;
          return (
            <>
              <PageHeader
                title={post.title}
                description={`${post.authorName} · ${dateTime(post.createdAt)}${post.kind ? ` · ${post.kind}` : ""}`}
                actions={
                  <>
                    <StatusBadge status={post.moderationStatus} />
                    {canModerate ? (
                      <Button type="button" variant="destructive" onClick={() => setDeletingPost(true)}>
                        <Trash2 /> {t("community.deletePost")}
                      </Button>
                    ) : null}
                  </>
                }
              />

              <Section
                id="post"
                title={t("community.post")}
                description={t("community.postStats", {
                  likes: number(post.likeCount),
                  reports: number(post.reportCount),
                })}
              >
                <p className="mb-2 text-sm">
                  <CustomerLink id={post.customerId} name={post.authorName} />
                </p>
                <p className="mb-5 max-w-prose whitespace-pre-line" dir="auto">
                  {post.body}
                </p>
                <TransitionActions
                  next={nextDecisions(post.moderationStatus)}
                  needsNote={(status) => status === "hidden"}
                  onRun={(status, note) => void moderate.run({ status, note })}
                  disabled={!canModerate}
                  pending={moderate.isPending}
                  error={moderate.error}
                  fieldError={moderate.fieldErrors?.note}
                  emptyLabel=""
                />
                {post.moderationNote ? (
                  <p className="mt-3 text-xs text-muted-foreground" dir="auto">
                    {`${t("field.note")}: ${post.moderationNote}`}
                  </p>
                ) : null}
              </Section>

              <PostComments key={post.id} postId={post.id} />

              <ConfirmDialog
                open={deletingPost}
                onOpenChange={setDeletingPost}
                title={t("crud.deleteTitle", { name: post.title })}
                description={t("community.deletePostBody")}
                onConfirm={async () => {
                  await communityAdminService.deletePost(post.id);
                  notice.success(t("crud.deleted", { name: post.title }));
                  navigate("/community");
                }}
              />
            </>
          );
        }}
      </AsyncBoundary>
    </RequirePermission>
  );
}
