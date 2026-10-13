import { ReferenceEditor } from "@/components/crud";
import { RequirePermission, usePermission } from "@/features/auth";
import { educationAdminService, type CourseCategory, type CourseCategoryDraft } from "@/features/education";
import { useFormatters, useTranslation } from "@/i18n";

const blank = { en: "", ar: "" };
const EMPTY: CourseCategoryDraft = { slug: "", name: blank, description: blank };

/**
 * How the academy's catalogue is grouped on the storefront. The slug is part of
 * the category's public address; the description is optional but, like every
 * storefront text, goes in both languages or neither. A category with courses
 * filed under it cannot be deleted — the count says how many.
 *
 * The table is one page of `GET /v1/admin/course-categories`, searched by either
 * name or the slug; the course form's checkboxes read the whole list from `/options`.
 */
export function CourseCategoriesRoute() {
  const { t } = useTranslation();
  const { text, number } = useFormatters();
  const canWrite = usePermission("education:write");

  return (
    <RequirePermission permission="education:read">
      <ReferenceEditor<CourseCategory, CourseCategoryDraft>
        title={t("courseCategories.title")}
        description={t("courseCategories.description")}
        noun={t("courseCategories.noun")}
        load={(query) => educationAdminService.listCategoriesPage(query)}
        nameOf={(category) => text(category.name)}
        canWrite={canWrite}
        columns={[
          { key: "en", header: "English", render: (category) => category.name.en || "—" },
          {
            key: "ar",
            header: "العربية",
            render: (category) => <span dir="rtl">{category.name.ar || "—"}</span>,
          },
          { key: "slug", header: t("field.slug"), render: (category) => <code dir="ltr">{category.slug}</code> },
          {
            key: "courses",
            header: t("courseCategories.courseCount"),
            align: "end",
            render: (category) => number(category.courseCount ?? 0),
          },
        ]}
        fields={[
          { kind: "localized", key: "name", label: t("field.name"), required: true },
          { kind: "slug", key: "slug", label: t("field.slug"), hint: t("field.slugHint"), required: true, from: "name" },
          {
            kind: "localizedMultiline",
            key: "description",
            label: t("field.description"),
            hint: t("courseCategories.descriptionHint"),
          },
        ]}
        empty={EMPTY}
        toDraft={(category) => ({
          slug: category.slug,
          name: category.name,
          description: category.description ?? blank,
        })}
        create={(draft) => educationAdminService.createCategory(draft)}
        update={(id, draft) => educationAdminService.updateCategory(id, draft)}
        remove={(id) => educationAdminService.deleteCategory(id)}
      />
    </RequirePermission>
  );
}
