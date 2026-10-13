import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ReferenceEditor } from "@/components/crud";
import { Badge, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { usePermission } from "@/features/auth";
import {
  LOOKUP_KIND_META,
  LOOKUP_KINDS,
  lookupsService,
  type LookupDraft,
  type LookupEntry,
  type LookupKind,
} from "@/features/lookups";
import { useFormatters, useTranslation } from "@/i18n";
import type { LocalizedText } from "@/types";

/**
 * The form's own shape: one bilingual `name` (so the dialog can use the same
 * `kind: "localized"` field sports and every other taxonomy screen use),
 * bridged to the service's flat `{nameEn, nameAr}` draft in `toServiceDraft`.
 */
interface LookupFormDraft {
  readonly name: LocalizedText;
  readonly isActive: boolean;
  readonly countryId?: string;
}

const EMPTY: LookupFormDraft = { name: { en: "", ar: "" }, isActive: true, countryId: undefined };

function toServiceDraft(kind: LookupKind, draft: LookupFormDraft): LookupDraft {
  return {
    nameEn: draft.name.en,
    nameAr: draft.name.ar,
    isActive: draft.isActive,
    ...(kind === "city" ? { countryId: draft.countryId ?? "" } : {}),
  };
}

function isLookupKind(value: string | null): value is LookupKind {
  return (LOOKUP_KINDS as readonly string[]).includes(value ?? "");
}

/**
 * Seven small reference tables behind the careers board and candidate
 * forms — countries, cities, job types, academic degrees and the rest —
 * managed as one screen: a tab strip picks the table, the same create / edit /
 * delete dialog handles all seven (`ReferenceEditor`). The active tab lives in
 * the URL (`?type=`), so a filtered view is shareable like every other admin
 * list; switching tabs also clears the page and search, since neither carries
 * over to a different table. `key={kind}` remounts the editor on tab change so
 * its internal state (the loaded page, an open dialog) never leaks between
 * tables.
 *
 * `City` is the one table with a relationship: its country is its own column
 * and a picker in the dialog, both fed by `listCountries()`, loaded alongside
 * every tab's page (cheap — the list is short and rarely changes).
 */
export function LookupsRoute() {
  const { t } = useTranslation();
  const { text } = useFormatters();
  const canWrite = usePermission("lookups:write");
  const [params, setParams] = useSearchParams();
  const [countries, setCountries] = useState<readonly LookupEntry[]>([]);

  const kindParam = params.get("type");
  const kind: LookupKind = isLookupKind(kindParam) ? kindParam : LOOKUP_KINDS[0];
  const meta = LOOKUP_KIND_META[kind];

  const setKind = (next: LookupKind) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("type", next);
    nextParams.delete("q");
    nextParams.delete("page");
    setParams(nextParams, { replace: true });
  };

  const nameOf = (row: LookupEntry) => text({ en: row.nameEn, ar: row.nameAr });
  const countryName = (countryId?: string) => {
    const country = countries.find((entry) => entry.id === countryId);
    return country ? nameOf(country) : "—";
  };

  return (
    <ReferenceEditor<LookupEntry, LookupFormDraft>
      key={kind}
      title={t(meta.labelKey)}
      description={t("lookups.description")}
      noun={t(meta.nounKey)}
      toolbar={
        <Tabs value={kind} onValueChange={(value) => setKind(value as LookupKind)}>
          <TabsList>
            {LOOKUP_KINDS.map((entry) => (
              <TabsTrigger key={entry} value={entry}>
                {t(LOOKUP_KIND_META[entry].labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      }
      load={async (query) => {
        const [page, countryList] = await Promise.all([lookupsService.listPage(kind, query), lookupsService.listCountries()]);
        setCountries(countryList);
        return page;
      }}
      nameOf={nameOf}
      canWrite={canWrite}
      columns={[
        { key: "en", header: "English", render: (row) => row.nameEn || "—" },
        { key: "ar", header: "العربية", render: (row) => <span dir="rtl">{row.nameAr || "—"}</span> },
        ...(kind === "city"
          ? [
              {
                key: "country",
                header: t("lookups.country"),
                render: (row: LookupEntry) => countryName(row.countryId),
              },
            ]
          : []),
        {
          key: "active",
          header: t("lookups.active"),
          render: (row) =>
            row.isActive ? <Badge>{t("lookups.active")}</Badge> : <Badge variant="outline">{t("lookups.inactive")}</Badge>,
        },
      ]}
      fields={[
        { kind: "localized", key: "name", label: t("field.name"), required: true },
        ...(kind === "city"
          ? [
              {
                kind: "select" as const,
                key: "countryId" as const,
                label: t("lookups.country"),
                hint: t("lookups.countryHint"),
                options: countries.map((country) => ({ value: country.id, label: nameOf(country) })),
              },
            ]
          : []),
        { kind: "checkbox", key: "isActive", label: t("lookups.active"), hint: t("lookups.activeHint") },
      ]}
      empty={EMPTY}
      toDraft={(row) => ({ name: { en: row.nameEn, ar: row.nameAr }, isActive: row.isActive, countryId: row.countryId })}
      create={(draft) => lookupsService.create(kind, toServiceDraft(kind, draft))}
      update={(id, draft) => lookupsService.update(kind, id, toServiceDraft(kind, draft))}
      remove={(id) => lookupsService.remove(kind, id)}
    />
  );
}
