import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, TableThumbnail, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { Button, ListCard, PageHeader, SearchInput, StatusBadge } from "@/components/ui";
import { usePermission } from "@/features/auth";
import { contentAdminService, type AdminArticle, type ArticleSortField } from "@/features/content";
import { useAsyncData, useListQuery } from "@/hooks";
import { LOCALES, LOCALE_LABELS, useFormatters, useTranslation } from "@/i18n";
import { missingLocales } from "@/lib";
import type { SortState } from "@/types";

export function ArticlesRoute() {
  const { t } = useTranslation();
  const { text, date } = useFormatters();
  const notice = useNotice();
  const canWrite = usePermission("content:write");
  const [deleting, setDeleting] = useState<AdminArticle | null>(null);
  const { query, setSearch, setPage, setSort } = useListQuery<ArticleSortField>({
    defaultSort: { field: "updatedAt", direction: "desc" },
  });

  const state = useAsyncData(() => contentAdminService.listArticles(query), [query]);

  const columns: readonly DataTableColumn<AdminArticle>[] = [
    {
      key: "cover",
      header: t("articles.coverColumn"),
      render: (row) => <TableThumbnail image={row.coverImage} />,
    },
    {
      key: "title",
      header: t("field.title"),
      sortField: "title",
      render: (row) => <Link to={`/content/articles/${row.id}`}>{text(row.title)}</Link>,
    },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      // Surfacing incomplete translations in the list is the point: a half
      // translated article is invisible otherwise until the Arabic site breaks.
      key: "translation",
      header: t("i18n.translation"),
      render: (row) => {
        const missing = missingLocales(row.title, LOCALES);
        return missing.length === 0
          ? t("i18n.complete")
          : `${t("i18n.missingIn")}: ${missing.map((locale) => LOCALE_LABELS[locale]).join(", ")}`;
      },
    },
    {
      key: "published",
      header: t("field.submitted"),
      sortField: "publishedAt",
      render: (row) => (row.publishedAt ? date(row.publishedAt) : "—"),
    },
    {
      key: "updated",
      header: t("field.updated"),
      sortField: "updatedAt",
      render: (row) => date(row.audit.updatedAt),
    },
    {
      key: "actions",
      header: t("field.actions"),
      align: "end",
      render: (row) => (
        <RowActions
          label={text(row.title)}
          canWrite={canWrite}
          editTo={`/content/articles/${row.id}`}
          onDelete={() => setDeleting(row)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("articles.title")}
        description={t("articles.description")}
        actions={
          canWrite ? (
            <Button asChild>
              <Link to="/content/articles/new">
                <Plus /> {t("crud.addNoun", { noun: t("articles.noun") })}
              </Link>
            </Button>
          ) : undefined
        }
      />
      <AsyncBoundary
        state={state}
        pendingLabel={t("state.loading")}
      >
        {(page) => (
          <ListCard
            toolbar={
              <SearchInput
                label={t("action.search")}
                value={query.search ?? ""}
                onChange={setSearch}
              />
            }
            footer={<PaginationControls meta={page.meta} onPageChange={setPage} />}
          >
            <DataTable
              caption={t("articles.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<ArticleSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: text(deleting.title) }) : ""}
        onConfirm={async () => {
          if (!deleting) return;
          await contentAdminService.deleteArticle(deleting.id);
          notice.success(t("crud.deleted", { name: text(deleting.title) }));
          state.refetch();
        }}
      />
    </>
  );
}
