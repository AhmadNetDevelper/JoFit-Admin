import { useState } from "react";

import { ReferenceEditor } from "@/components/crud";
import { TableThumbnail } from "@/components/data-table";
import {
  catalogueService,
  type ProductCategory,
  type ProductCategoryDraft,
} from "@/features/catalogue";
import { usePermission } from "@/features/auth";
import { sportsService, type Sport } from "@/features/sports";
import { useFormatters, useTranslation } from "@/i18n";

const EMPTY: ProductCategoryDraft = {
  slug: "",
  name: { en: "", ar: "" },
  description: { en: "", ar: "" },
  parentId: null,
  sportIds: [],
  image: undefined,
};

const toDraft = (category: ProductCategory): ProductCategoryDraft => ({
  slug: category.slug,
  name: category.name,
  description: { en: category.description?.en ?? "", ar: category.description?.ar ?? "" },
  parentId: category.parentId,
  sportIds: category.sportIds,
  image: category.image,
});

/** Whether `id` is `ancestorId` itself or sits somewhere beneath it. */
function isWithin(all: readonly ProductCategory[], id: string, ancestorId: string): boolean {
  let current: string | null = id;
  /* Bounded by the list length, so a malformed tree cannot loop forever. */
  for (let depth = 0; current && depth <= all.length; depth += 1) {
    if (current === ancestorId) return true;
    const parentOf: string = current;
    current = all.find((entry) => entry.id === parentOf)?.parentId ?? null;
  }
  return false;
}

/**
 * The shop's category tree. Both language names sit side by side, as on the
 * sports screen: a category without its Arabic name is a blank link in the
 * Arabic storefront's menu. A category still holding products or
 * sub-categories cannot be deleted — the refusal says how many.
 *
 * The table is one page from the API, searched there; the parent column and
 * the parent picker need the whole tree, so they read the picker list
 * (`listCategories`, the `/options` endpoint) alongside it.
 */
export function CategoriesRoute() {
  const { t } = useTranslation();
  const { text, number, date } = useFormatters();
  const canWrite = usePermission("catalogue:write");
  /* Every category, kept for the parent picker and the parent column — a
     parent is often on another page of the table. It is refreshed with the
     table, so a category just added can be chosen as a parent straight away. */
  const [all, setAll] = useState<readonly ProductCategory[]>([]);
  const [sports, setSports] = useState<readonly Sport[]>([]);
  const nameOf = (category: ProductCategory) => text(category.name);

  return (
    <ReferenceEditor<ProductCategory, ProductCategoryDraft>
      title={t("categories.title")}
      description={t("categories.description")}
      noun={t("categories.noun")}
      load={async (query) => {
        const [page, every, sportList] = await Promise.all([
          catalogueService.listCategoriesPage(query),
          catalogueService.listCategories(),
          sportsService.list(),
        ]);
        setAll(every);
        setSports(sportList);
        return page;
      }}
      nameOf={nameOf}
      canWrite={canWrite}
      columns={[
        { key: "image", header: t("categories.image"), render: (row) => <TableThumbnail image={row.image} /> },
        { key: "en", header: "English", render: (row) => row.name.en || "—" },
        { key: "ar", header: "العربية", render: (row) => <span dir="rtl">{row.name.ar || "—"}</span> },
        { key: "slug", header: t("field.slug"), render: (row) => <code dir="ltr">{row.slug}</code> },
        {
          key: "parent",
          header: t("field.parent"),
          render: (row) => {
            const parent = row.parentId ? all.find((category) => category.id === row.parentId) : undefined;
            return parent ? nameOf(parent) : "—";
          },
        },
        {
          key: "count",
          header: t("brands.productCount"),
          align: "end",
          render: (row) => number(row.productCount),
        },
        { key: "updated", header: t("field.updated"), render: (row) => date(row.audit.updatedAt) },
      ]}
      fields={(editing) => [
        { kind: "localized", key: "name", label: t("field.name"), required: true },
        { kind: "slug", key: "slug", label: t("field.slug"), hint: t("field.slugHint"), required: true, from: "name" },
        { kind: "localizedMultiline", key: "description", label: t("field.description") },
        {
          kind: "image",
          key: "image",
          label: t("categories.image"),
          hint: t("categories.imageHint"),
          purpose: "product-category",
          aspect: "video",
        },
        {
          kind: "select",
          key: "parentId",
          label: t("field.parent"),
          hint: t("categories.parentHint"),
          /* A category cannot sit under itself or anything beneath it, so
             those are not offered (the service refuses them too). */
          options: [
            { value: "", label: t("field.none") },
            ...all
              .filter((category) => !editing || !isWithin(all, category.id, editing.id))
              .map((category) => ({ value: category.id, label: nameOf(category) })),
          ],
        },
        {
          kind: "multiselect",
          key: "sportIds",
          label: t("field.sports"),
          options: sports.map((sport) => ({ value: sport.id, label: text(sport.name) })),
        },
      ]}
      empty={EMPTY}
      toDraft={toDraft}
      create={(draft) => catalogueService.createCategory(draft)}
      update={(id, draft) => catalogueService.updateCategory(id, draft)}
      remove={(id) => catalogueService.deleteCategory(id)}
    />
  );
}
