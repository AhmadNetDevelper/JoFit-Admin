import type { TranslationKey } from "@/i18n/dictionaries";

/**
 * Eight small reference tables the live API already exposes in full —
 * `AcademicDegree`, `City`, `Country`, `Course`, `JobStatus`, `JobType`,
 * `UniversityMajor`, `UserJobType` — that neither admin nor the storefront
 * reads yet. The careers board and candidate profile forms still hardcode
 * these as option lists in the i18n dictionaries; wiring them to fetch from
 * here instead is a separate follow-up, not this screen's job.
 *
 * `Course` here is NOT the published course-catalogue screen
 * (`AdminCourseCatalogue`/`AdminCourseCategories`, under the `education`
 * feature) — it's a separate, plain reference table that happens to share a
 * name, confirmed unused elsewhere today.
 *
 * Every table shares one shape on the wire: `{id, nameAr, nameEn, isActive}`.
 * `City` adds `countryId`; `UserJobType` adds `isNormalUser`, set by the
 * server and never part of a create or update body.
 */
export const LOOKUP_KINDS = [
  "academic-degree",
  "city",
  "country",
  "course",
  "job-status",
  "job-type",
  "university-major",
  "user-job-type",
] as const;

export type LookupKind = (typeof LOOKUP_KINDS)[number];

export interface LookupEntry {
  readonly id: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly isActive: boolean;
  /** `city` only — the id of the country it belongs to. */
  readonly countryId?: string;
  /** `user-job-type` only — computed by the server. */
  readonly isNormalUser?: boolean;
}

/** The editable part of a lookup entry. */
export type LookupDraft = Omit<LookupEntry, "id">;

export interface LookupKindMeta {
  /** The live spec's exact, case-sensitive path segment — `GET/POST /api/v1/{apiSegment}`. */
  readonly apiSegment: string;
  /** The tab strip's label and the screen's title while that tab is open. */
  readonly labelKey: TranslationKey;
  /** Singular noun for "Add {noun}" / "New {noun}" / "Edit {noun}". */
  readonly nounKey: TranslationKey;
}

export const LOOKUP_KIND_META: Readonly<Record<LookupKind, LookupKindMeta>> = {
  "academic-degree": {
    apiSegment: "AcademicDegree",
    labelKey: "lookups.kind.academic-degree",
    nounKey: "lookups.noun.academic-degree",
  },
  city: { apiSegment: "City", labelKey: "lookups.kind.city", nounKey: "lookups.noun.city" },
  country: { apiSegment: "Country", labelKey: "lookups.kind.country", nounKey: "lookups.noun.country" },
  course: { apiSegment: "Course", labelKey: "lookups.kind.course", nounKey: "lookups.noun.course" },
  "job-status": {
    apiSegment: "JobStatus",
    labelKey: "lookups.kind.job-status",
    nounKey: "lookups.noun.job-status",
  },
  "job-type": { apiSegment: "JobType", labelKey: "lookups.kind.job-type", nounKey: "lookups.noun.job-type" },
  "university-major": {
    apiSegment: "UniversityMajor",
    labelKey: "lookups.kind.university-major",
    nounKey: "lookups.noun.university-major",
  },
  "user-job-type": {
    apiSegment: "UserJobType",
    labelKey: "lookups.kind.user-job-type",
    nounKey: "lookups.noun.user-job-type",
  },
};
