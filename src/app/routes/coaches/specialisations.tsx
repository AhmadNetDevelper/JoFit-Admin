import { ReferenceEditor } from "@/components/crud";
import { RequirePermission, usePermission } from "@/features/auth";
import {
  coachesAdminService,
  type CoachSpecialisation,
  type CoachSpecialisationDraft,
} from "@/features/coaches";
import { useFormatters, useTranslation } from "@/i18n";

const EMPTY: CoachSpecialisationDraft = { name: { en: "", ar: "" } };

/**
 * The specialisations a coach can list. The storefront filters and links by the
 * id and prints the name in the reader's language, so both names are shown side
 * by side — a missing Arabic name leaves an English label on `/ar/coaches`. One
 * still on any coach's profile cannot be deleted; the count says how many.
 *
 * The table is one page of `GET /v1/admin/coach-specialisations`, searched by
 * either name; the profile form's checkboxes read the whole list from `/options`.
 */
export function SpecialisationsRoute() {
  const { t } = useTranslation();
  const { text, number } = useFormatters();
  const canWrite = usePermission("coaches:write");

  return (
    <RequirePermission permission="coaches:read">
      <ReferenceEditor<CoachSpecialisation, CoachSpecialisationDraft>
        title={t("specialisations.title")}
        description={t("specialisations.description")}
        noun={t("specialisations.noun")}
        load={(query) => coachesAdminService.listSpecialisationsPage(query)}
        nameOf={(entry) => text(entry.name)}
        canWrite={canWrite}
        columns={[
          { key: "en", header: "English", render: (entry) => entry.name.en || "—" },
          { key: "ar", header: "العربية", render: (entry) => <span dir="rtl">{entry.name.ar || "—"}</span> },
          {
            key: "coaches",
            header: t("specialisations.coachCount"),
            align: "end",
            render: (entry) => (entry.coachCount === undefined ? "—" : number(entry.coachCount)),
          },
        ]}
        fields={[{ kind: "localized", key: "name", label: t("field.name"), required: true }]}
        empty={EMPTY}
        toDraft={(entry) => ({ name: entry.name })}
        create={(draft) => coachesAdminService.createSpecialisation(draft)}
        update={(id, draft) => coachesAdminService.updateSpecialisation(id, draft)}
        remove={(id) => coachesAdminService.deleteSpecialisation(id)}
      />
    </RequirePermission>
  );
}
