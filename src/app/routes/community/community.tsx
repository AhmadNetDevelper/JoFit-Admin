import { useState } from "react";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { ListCard, PageHeader, SearchInput, StatusBadge } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  COMMUNITY_MODERATION_STATUSES,
  communityAdminService,
  type CommunityPost,
  type CommunityPostSortField,
} from "@/features/community";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { SortState } from "@/types";

import { CustomerLink, RecordLink } from "../../components/record-parts";
import { StatusFilter } from "../../components/status-filter";
import { useStatusParam } from "../../use-status-param";
import { recordPath } from "../../record-paths";

/**
 * Community moderation is reactive: posts go live when written, and this queue
 * is what members reported. It opens sorted by reports, so the loudest problem
 * is at the top.
 */
export function CommunityRoute() {
  const { t } = useTranslation();
  const { number, dateTime, text } = useFormatters();
  const notice = useNotice();
  const canModerate = usePermission("community:moderate");
  const [deleting, setDeleting] = useState<CommunityPost | null>(null);
  const { query, setSearch, setPage, setSort } = useListQuery<CommunityPostSortField>({
    defaultSort: { field: "reportCount", direction: "desc" },
  });
  const [statuses, setStatuses] = useStatusParam(COMMUNITY_MODERATION_STATUSES);

  const state = useAsyncData(async () => {
    const [posts, topics] = await Promise.all([
      communityAdminService.listPosts({ ...query, statuses }),
      communityAdminService.listTopics(),
    ]);
    return { posts, topics };
  }, [query, statuses?.join()]);

  return (
    <>
      <PageHeader title={t("community.title")} description={t("community.description")} />
      <AsyncBoundary
        state={state}
        pendingLabel={t("state.loading")}
      >
        {({ posts, topics }) => {
          const columns: readonly DataTableColumn<CommunityPost>[] = [
            {
              key: "title",
              header: t("field.title"),
              render: (row) => (
                <RecordLink to={recordPath.communityPost(row.id)}>
                  <span dir="auto">{row.title}</span>
                </RecordLink>
              ),
            },
            {
              key: "author",
              header: t("field.author"),
              render: (row) => <CustomerLink id={row.customerId} name={row.authorName} />,
            },
            {
              key: "topic",
              header: t("community.topic"),
              render: (row) =>
                topics
                  .filter((topic) => row.topicIds.includes(topic.id))
                  .map((topic) => text(topic.name))
                  .join(", "),
            },
            { key: "kind", header: t("community.kind"), render: (row) => row.kind ?? "—" },
            {
              key: "status",
              header: t("field.status"),
              render: (row) => <StatusBadge status={row.moderationStatus} />,
            },
            {
              key: "reports",
              header: t("community.reports"),
              sortField: "reportCount",
              align: "end",
              render: (row) => (
                <span className={row.reportCount > 0 ? "font-semibold text-destructive" : undefined}>
                  {number(row.reportCount)}
                </span>
              ),
            },
            {
              key: "comments",
              header: t("community.comments"),
              align: "end",
              render: (row) => number(row.commentCount),
            },
            {
              key: "createdAt",
              header: t("field.submitted"),
              sortField: "createdAt",
              render: (row) => dateTime(row.createdAt),
            },
            {
              /* Delete only: members' posts are moderated from their page, never edited by staff. */
              key: "actions",
              header: t("field.actions"),
              align: "end",
              render: (row) => (
                <RowActions label={row.title} canWrite={canModerate} onDelete={() => setDeleting(row)} />
              ),
            },
          ];

          return (
            <ListCard
              toolbar={
                <>
                  <SearchInput
                    label={t("action.search")}
                    value={query.search ?? ""}
                    onChange={setSearch}
                  />
                  <StatusFilter
                    statuses={COMMUNITY_MODERATION_STATUSES}
                    value={statuses}
                    onChange={setStatuses}
                  />
                </>
              }
              footer={<PaginationControls meta={posts.meta} onPageChange={setPage} />}
            >
              <DataTable
                caption={t("community.title")}
                columns={columns}
                rows={posts.items}
                getRowKey={(row) => row.id}
                sort={query.sort}
                onSortChange={(sort) => setSort(sort as SortState<CommunityPostSortField>)}
              />
            </ListCard>
          );
        }}
      </AsyncBoundary>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: deleting.title }) : ""}
        description={t("community.deletePostBody")}
        onConfirm={async () => {
          if (!deleting) return;
          await communityAdminService.deletePost(deleting.id);
          notice.success(t("crud.deleted", { name: deleting.title }));
          state.refetch();
        }}
      />
    </>
  );
}
