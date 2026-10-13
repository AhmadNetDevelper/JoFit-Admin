import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog, RowActions } from "@/components/crud";
import { DataTable, PaginationControls, TableThumbnail, type DataTableColumn } from "@/components/data-table";
import { AsyncBoundary, useNotice } from "@/components/feedback";
import { Button, ListCard, PageHeader, SearchInput, StatusBadge } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  educationAdminService,
  type AdminCourse,
  type CourseSortField,
} from "@/features/education";
import { useAsyncData, useListQuery } from "@/hooks";
import { useFormatters, useTranslation } from "@/i18n";
import type { MediaImage, SortState } from "@/types";

import { RecordLink } from "../../components/record-parts";
import { recordPath } from "../../record-paths";
import { FORMAT_LABEL, LEVEL_LABEL } from "./course-labels";

/** The course's cover: its first image, as the storefront's card shows it. */
const coverOf = (course: AdminCourse) =>
  course.media.find((entry): entry is MediaImage => entry.kind === "image");

export function CoursesRoute() {
  const { t } = useTranslation();
  const { text, money, number, date } = useFormatters();
  const notice = useNotice();
  const canWrite = usePermission("education:write");
  const { query, setSearch, setPage, setSort } = useListQuery<CourseSortField>({
    defaultSort: { field: "title", direction: "asc" },
  });
  const [deleting, setDeleting] = useState<AdminCourse | null>(null);

  const state = useAsyncData(() => educationAdminService.listCourses(query), [query]);

  const columns: readonly DataTableColumn<AdminCourse>[] = [
    { key: "image", header: t("courses.image"), render: (row) => <TableThumbnail image={coverOf(row)} /> },
    {
      key: "title",
      header: t("field.title"),
      sortField: "title",
      render: (row) => <RecordLink to={recordPath.course(row.id)}>{text(row.title)}</RecordLink>,
    },
    {
      key: "status",
      header: t("field.status"),
      sortField: "status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "format",
      header: t("courses.format"),
      render: (row) => `${t(FORMAT_LABEL[row.format])} · ${t(LEVEL_LABEL[row.level])}`,
    },
    {
      key: "intake",
      header: t("courses.nextIntake"),
      render: (row) => (
        <span className="flex flex-wrap items-center gap-2">
          {date(row.nextIntake.startsOn)}
          <StatusBadge status={row.nextIntake.state} />
        </span>
      ),
    },
    {
      key: "seats",
      header: t("courses.seats"),
      align: "end",
      render: (row) => `${number(row.nextIntake.seatsTaken)} / ${number(row.nextIntake.seatsTotal)}`,
    },
    { key: "price", header: t("field.price"), align: "end", render: (row) => money(row.price) },
    {
      key: "enrolments",
      header: t("courses.enrolled"),
      sortField: "enrolmentCount",
      align: "end",
      render: (row) => number(row.enrolmentCount),
    },
    {
      key: "actions",
      header: t("field.actions"),
      align: "end",
      render: (row) => (
        <RowActions
          label={text(row.title)}
          canWrite={canWrite}
          editTo={recordPath.course(row.id)}
          onDelete={() => setDeleting(row)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("courses.title")}
        description={t("courses.description")}
        actions={
          canWrite ? (
            <Button asChild>
              <Link to="/education/courses/new">
                <Plus /> {t("crud.addNoun", { noun: t("courses.noun") })}
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
              caption={t("courses.title")}
              columns={columns}
              rows={page.items}
              getRowKey={(row) => row.id}
              sort={query.sort}
              onSortChange={(sort) => setSort(sort as SortState<CourseSortField>)}
            />
          </ListCard>
        )}
      </AsyncBoundary>

      {/* A course anyone still holds a place on is refused; the reason shows in
          the dialog itself. */}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("crud.deleteTitle", { name: text(deleting.title) }) : ""}
        description={t("courses.deleteBody")}
        onConfirm={async () => {
          if (!deleting) return;
          await educationAdminService.deleteCourse(deleting.id);
          notice.success(t("crud.deleted", { name: text(deleting.title) }));
          state.refetch();
        }}
      />
    </>
  );
}
