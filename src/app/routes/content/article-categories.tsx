import { ReferenceEditor } from "@/components/crud";
import { RequirePermission, usePermission } from "@/features/auth";
import { contentAdminService, type ArticleCategory, type ArticleCategoryDraft } from "@/features/content";
import { useFormatters, useTranslation } from "@/i18n";

const EMPTY: ArticleCategoryDraft = { slug: "", name: { en: "", ar: "" } };

/**
 * Content → Article categories. The blog's sections, named in both languages
 * because the Arabic blog navigates by the same list. The article count is
 * shown because it is why a delete may be refused: a category still holding
 * articles cannot go until they are moved.
 */
export function ArticleCategoriesRoute() {
  const { t } = useTranslation();
  const { text, number } = useFormatters();
  const canWrite = usePermission("content:write");

  return (
    <RequirePermission permission="content:read">
      <ReferenceEditor<ArticleCategory, ArticleCategoryDraft>
        title={t("articleCategories.title")}
        description={t("articleCategories.description")}
        noun={t("articleCategories.noun")}
        load={(query) => contentAdminService.listCategoriesPage(query)}
        nameOf={(category) => text(category.name)}
        canWrite={canWrite}
        columns={[
          { key: "en", header: "English", render: (category) => category.name.en || "—" },
          { key: "ar", header: "العربية", render: (category) => <span dir="rtl">{category.name.ar || "—"}</span> },
          { key: "slug", header: t("field.slug"), render: (category) => <code dir="ltr">{category.slug}</code> },
          {
            key: "articles",
            header: t("content.articleCount"),
            align: "end",
            render: (category) => <span data-figure>{number(category.articleCount ?? 0)}</span>,
          },
        ]}
        fields={[
          { kind: "localized", key: "name", label: t("field.name"), required: true },
          { kind: "slug", key: "slug", label: t("field.slug"), hint: t("field.slugHint"), required: true, from: "name" },
          { kind: "localizedMultiline", key: "description", label: t("field.description") },
        ]}
        empty={EMPTY}
        toDraft={({ id: _id, articleCount: _count, ...draft }) => draft}
        create={(draft) => contentAdminService.createCategory(draft)}
        update={(id, draft) => contentAdminService.updateCategory(id, draft)}
        remove={(id) => contentAdminService.deleteCategory(id)}
      />
    </RequirePermission>
  );
}
