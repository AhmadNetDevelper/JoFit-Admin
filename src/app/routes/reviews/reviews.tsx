import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { ListEmpty, PaginationControls } from "@/components/data-table";
import { Field, FormError } from "@/components/form";
import {
  Badge,
  Button,
  Input,
  Label,
  ListCard,
  PageHeader,
  SearchInput,
  StatusBadge,
  Switch,
} from "@/components/ui";
import { usePermission } from "@/features/auth";
import { reviewsAdminService, type AdminReview, type ReviewSortField } from "@/features/reviews";
import { useAsyncAction, useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";

import { CustomerLink, RecordLink } from "../../components/record-parts";
import { reviewTargetPath } from "../../record-paths";

/**
 * A moderation queue is read as prose, not as a table — the reviewer needs the
 * whole review body to make a decision, which a table row cannot show. This is
 * why not every list screen uses `DataTable`.
 *
 * Review bodies are customer-written, so they are rendered as stored and never
 * translated; `dir="auto"` lets the browser pick the direction per review, which
 * matters when English and Arabic reviews sit in the same queue.
 */
function ReviewCard({
  review,
  onModerated,
  onDelete,
}: {
  review: AdminReview;
  onModerated: () => void;
  /** Spam only; the menu stays out of the way of the moderation buttons. */
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { dateTime } = useFormatters();
  const canModerate = usePermission("reviews:moderate");
  const [note, setNote] = useState(review.moderationNote ?? "");

  const moderate = useAsyncAction(
    (status: "approved" | "rejected") =>
      reviewsAdminService.moderate({ reviewId: review.id, status, note }),
    { onSuccess: onModerated },
  );

  return (
    <li className="p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={review.moderationStatus} />
        <span data-figure className="font-semibold">{`${review.rating}/5`}</span>
        <span className="text-muted-foreground">
          {`${t("field.target")}: `}
          <RecordLink to={reviewTargetPath(review.target.type, review.target.id)}>{review.target.title}</RecordLink>
        </span>
        <CustomerLink id={review.customerId} name={review.authorName} />
        {review.isVerifiedPurchase ? <Badge variant="secondary">{t("reviews.verified")}</Badge> : null}
        <span className="text-muted-foreground">{dateTime(review.submittedAt)}</span>
        <span className="ms-auto">
          <RowActions label={review.title ?? review.authorName} canWrite={canModerate} onDelete={onDelete} />
        </span>
      </div>

      {review.title ? (
        <p className="font-semibold" dir="auto">
          {review.title}
        </p>
      ) : null}
      <p className="mb-4 max-w-prose text-sm" dir="auto">
        {review.body}
      </p>

      {review.moderationStatus === "pending" ? (
        /* The decision sits in its own panel under the review it is about, so
           the reason box is never mistaken for part of the customer's text. */
        <section
          aria-labelledby={`review-${review.id}-decision`}
          className="max-w-2xl rounded-lg border bg-muted/30 p-4"
        >
          <p id={`review-${review.id}-decision`} className="mb-3 text-sm font-medium">
            {t("reviews.moderateTitle")}
          </p>
          <Field label={t("field.reason")} error={moderate.fieldErrors?.note} className="mb-3">
            {(props) => (
              <Input
                {...props}
                type="text"
                dir="auto"
                className="bg-background"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={!canModerate || moderate.isPending}
              onClick={() => void moderate.run("approved")}
            >
              <Check /> {t("action.approve")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!canModerate || moderate.isPending}
              onClick={() => void moderate.run("rejected")}
            >
              <X /> {t("action.reject")}
            </Button>
            {moderate.isPending ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
            ) : null}
          </div>
          <FormError error={moderate.error} />
        </section>
      ) : review.moderationNote ? (
        <p className="text-xs text-muted-foreground">{`${t("field.note")}: ${review.moderationNote}`}</p>
      ) : null}
    </li>
  );
}

export function ReviewsRoute() {
  const { t } = useTranslation();
  const notice = useNotice();
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const { query, flags, setSearch, setPage, setFlag } = useListQuery<ReviewSortField>({
    defaultSort: { field: "submittedAt", direction: "desc" },
  });

  const pendingOnly = flags.pending ?? false;
  const state = useAsyncData(
    () =>
      reviewsAdminService.listReviews({
        ...query,
        moderationStatuses: pendingOnly ? ["pending"] : undefined,
      }),
    [query, pendingOnly],
  );

  return (
    <>
      <PageHeader title={t("reviews.title")} description={t("reviews.description")} />

      <AsyncBoundary
        state={state}
        pendingLabel={t("state.loading")}
      >
        {(page) => (
          <ListCard
            toolbar={
              <>
                <SearchInput
                  label={t("action.search")}
                  value={query.search ?? ""}
                  onChange={setSearch}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="reviews-pending-only"
                    checked={pendingOnly}
                    onCheckedChange={(checked) => setFlag("pending", checked)}
                  />
                  <Label htmlFor="reviews-pending-only" className="font-normal">
                    {t("reviews.pendingOnly")}
                  </Label>
                </div>
              </>
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            {/* Reviews are read, not scanned, so the queue is a list of prose
                blocks rather than table rows — but it is still a list, and it
                gets the same frame as every other list in the admin. */}
            {page.items.length === 0 ? <ListEmpty /> : null}
            <ul className="divide-y divide-border">
              {page.items.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onModerated={state.refetch}
                  onDelete={() => setDeleting(review)}
                />
              ))}
            </ul>
          </ListCard>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("reviews.deleteTitle", { name: deleting.authorName }) : ""}
        description={t("reviews.deleteBody")}
        onConfirm={async () => {
          if (!deleting) return;
          await reviewsAdminService.deleteReview(deleting.id);
          notice.success(t("reviews.deleted"));
          state.refetch();
        }}
      />
    </>
  );
}
