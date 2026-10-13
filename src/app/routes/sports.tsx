import { ReferenceEditor } from "@/components/crud";
import { TableThumbnail } from "@/components/data-table";
import { Badge } from "@/components/ui";
import { usePermission } from "@/features/auth";
import { sportsService, type Sport, type SportDraft } from "@/features/sports";
import { useFormatters, useTranslation } from "@/i18n";

const EMPTY: SportDraft = {
  slug: "",
  name: { en: "", ar: "" },
  description: { en: "", ar: "" },
  isFeatured: false,
  image: undefined,
};

/**
 * Sports are the shared taxonomy every other domain files things under, so
 * both language names are shown side by side — a missing Arabic name here
 * silently breaks category navigation on the Arabic storefront. A sport still
 * used by products, hires, coaches or courses cannot be deleted.
 *
 * The table reads one page at a time from the API (`listPage`); the pickers
 * on other screens read the whole list from `list()`.
 */
export function SportsRoute() {
  const { t } = useTranslation();
  const { text } = useFormatters();
  const canWrite = usePermission("sports:write");

  return (
    <ReferenceEditor<Sport, SportDraft>
      title={t("sports.title")}
      description={t("sports.description")}
      noun={t("sports.noun")}
      load={(query) => sportsService.listPage(query)}
      nameOf={(sport) => text(sport.name)}
      canWrite={canWrite}
      columns={[
        { key: "image", header: t("sports.image"), render: (sport) => <TableThumbnail image={sport.image} /> },
        { key: "en", header: "English", render: (sport) => sport.name.en || "—" },
        { key: "ar", header: "العربية", render: (sport) => <span dir="rtl">{sport.name.ar || "—"}</span> },
        { key: "slug", header: t("field.slug"), render: (sport) => <code dir="ltr">{sport.slug}</code> },
        {
          key: "featured",
          header: t("sports.featured"),
          render: (sport) => (sport.isFeatured ? <Badge>{t("sports.featured")}</Badge> : "—"),
        },
      ]}
      fields={[
        { kind: "localized", key: "name", label: t("field.name"), required: true },
        { kind: "slug", key: "slug", label: t("field.slug"), hint: t("field.slugHint"), required: true, from: "name" },
        { kind: "localizedMultiline", key: "description", label: t("field.description"), hint: t("sports.descriptionHint") },
        {
          kind: "image",
          key: "image",
          label: t("sports.image"),
          hint: t("sports.imageHint"),
          purpose: "sport",
          aspect: "video",
          fit: "cover",
        },
        { kind: "checkbox", key: "isFeatured", label: t("sports.featured"), hint: t("sports.featuredHint") },
      ]}
      empty={EMPTY}
      toDraft={({ id: _id, ...draft }) => draft}
      create={(draft) => sportsService.create(draft)}
      update={(id, draft) => sportsService.update(id, draft)}
      remove={(id) => sportsService.remove(id)}
    />
  );
}
