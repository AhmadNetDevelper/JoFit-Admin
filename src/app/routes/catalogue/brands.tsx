import { ReferenceEditor } from "@/components/crud";
import { TableThumbnail } from "@/components/data-table";
import { usePermission } from "@/features/auth";
import { catalogueService, type Brand, type BrandDraft } from "@/features/catalogue";
import { useFormatters, useTranslation } from "@/i18n";

const EMPTY: BrandDraft = { slug: "", name: "", description: { en: "", ar: "" }, logo: undefined };

const toDraft = (brand: Brand): BrandDraft => ({
  slug: brand.slug,
  name: brand.name,
  description: { en: brand.description?.en ?? "", ar: brand.description?.ar ?? "" },
  logo: brand.logo,
});

/**
 * The makers the shop sells. A brand's name is a proper noun — "Apex" in both
 * languages — so it is one plain field, while its description is written in
 * each. Its logo is drawn whole on a plain ground (`contain`), never cropped.
 * A brand still carried by products cannot be deleted. The table is paged
 * and searched by the API; the product editor's picker reads every brand.
 */
export function BrandsRoute() {
  const { t } = useTranslation();
  const { text, number, date } = useFormatters();
  const canWrite = usePermission("catalogue:write");

  return (
    <ReferenceEditor<Brand, BrandDraft>
      title={t("brands.title")}
      description={t("brands.description")}
      noun={t("brands.noun")}
      load={(query) => catalogueService.listBrandsPage(query)}
      nameOf={(brand) => brand.name}
      canWrite={canWrite}
      columns={[
        {
          key: "logo",
          header: t("brands.logo"),
          render: (row) => <TableThumbnail image={row.logo} fit="contain" />,
        },
        // A brand name is a proper noun, so it is rendered as stored, not localized.
        { key: "name", header: t("field.name"), render: (row) => row.name },
        { key: "slug", header: t("field.slug"), render: (row) => <code dir="ltr">{row.slug}</code> },
        {
          key: "description",
          header: t("field.description"),
          render: (row) => (row.description ? text(row.description) : "—"),
        },
        {
          key: "count",
          header: t("brands.productCount"),
          align: "end",
          render: (row) => number(row.productCount),
        },
        { key: "updated", header: t("field.updated"), render: (row) => date(row.audit.updatedAt) },
      ]}
      fields={[
        { kind: "text", key: "name", label: t("field.name"), hint: t("brands.nameHint"), required: true },
        { kind: "slug", key: "slug", label: t("field.slug"), hint: t("field.slugHint"), required: true, from: "name" },
        { kind: "localizedMultiline", key: "description", label: t("field.description") },
        {
          kind: "image",
          key: "logo",
          label: t("brands.logo"),
          hint: t("brands.logoHint"),
          purpose: "brand-logo",
          aspect: "square",
          fit: "contain",
        },
      ]}
      empty={EMPTY}
      toDraft={toDraft}
      create={(draft) => catalogueService.createBrand(draft)}
      update={(id, draft) => catalogueService.updateBrand(id, draft)}
      remove={(id) => catalogueService.deleteBrand(id)}
    />
  );
}
