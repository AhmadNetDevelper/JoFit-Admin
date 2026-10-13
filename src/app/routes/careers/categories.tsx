import { ReferenceEditor } from "@/components/crud";
import { RequirePermission, usePermission } from "@/features/auth";
import { careersAdminService, type JobCategory, type JobCategoryDraft } from "@/features/careers";
import { useFormatters, useTranslation } from "@/i18n";

const EMPTY: JobCategoryDraft = { slug: "", name: { en: "", ar: "" } };

/**
 * Careers → Job categories. How the careers board files its jobs — the board
 * filters by these, in both languages. The counts are shown because they are
 * why a delete may be refused: a category jobs are filed under stays, since
 * the jobs are the employers' and staff cannot move them.
 */
export function JobCategoriesRoute() {
  const { t } = useTranslation();
  const { text, number } = useFormatters();
  const canWrite = usePermission("careers:write");

  return (
    <RequirePermission permission="careers:read">
      <ReferenceEditor<JobCategory, JobCategoryDraft>
        title={t("careers.categories.title")}
        description={t("careers.categories.description")}
        noun={t("careers.categories.noun")}
        load={(query) => careersAdminService.listCategoriesPage(query)}
        nameOf={(category) => text(category.name)}
        canWrite={canWrite}
        columns={[
          { key: "en", header: "English", render: (category) => category.name.en || "—" },
          { key: "ar", header: "العربية", render: (category) => <span dir="rtl">{category.name.ar || "—"}</span> },
          { key: "slug", header: t("field.slug"), render: (category) => <code dir="ltr">{category.slug}</code> },
          {
            key: "jobs",
            header: t("careers.categories.jobs"),
            align: "end",
            render: (category) => <span data-figure>{number(category.jobCount ?? 0)}</span>,
          },
          {
            key: "open",
            header: t("careers.categories.open"),
            align: "end",
            render: (category) => <span data-figure>{number(category.openJobCount ?? 0)}</span>,
          },
        ]}
        fields={[
          { kind: "localized", key: "name", label: t("field.name"), required: true },
          { kind: "slug", key: "slug", label: t("field.slug"), hint: t("field.slugHint"), required: true, from: "name" },
        ]}
        empty={EMPTY}
        toDraft={({ id: _id, jobCount: _jobs, openJobCount: _open, ...draft }) => draft}
        create={(draft) => careersAdminService.createCategory(draft)}
        update={(id, draft) => careersAdminService.updateCategory(id, draft)}
        remove={(id) => careersAdminService.deleteCategory(id)}
      />
    </RequirePermission>
  );
}
