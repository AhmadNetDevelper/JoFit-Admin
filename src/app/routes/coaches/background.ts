import type {
  CoachCertificateDraft,
  CoachDraft,
  CoachEducationDraft,
  CoachExperienceDraft,
  CoachSkillDraft,
} from "@/features/coaches";
import { lookupsService, type LookupEntry, type LookupKind } from "@/features/lookups";
import type { TranslationKey } from "@/i18n";

/** The reference tables the background sections choose from. */
export interface BackgroundOptions {
  readonly academicDegrees: readonly LookupEntry[];
  readonly universityMajors: readonly LookupEntry[];
  readonly jobTypes: readonly LookupEntry[];
  readonly courses: readonly LookupEntry[];
}

/* One page of the largest size covers each table. An inactive entry is kept
   for the records that use it, never offered anew. */
async function activeEntries(kind: LookupKind): Promise<readonly LookupEntry[]> {
  const page = await lookupsService.listPage(kind, { pageSize: 100 });
  return page.items.filter((entry) => entry.isActive);
}

export async function loadBackgroundOptions(): Promise<BackgroundOptions> {
  const [academicDegrees, universityMajors, jobTypes, courses] = await Promise.all([
    activeEntries("academic-degree"),
    activeEntries("university-major"),
    activeEntries("job-type"),
    activeEntries("course"),
  ]);
  return { academicDegrees, universityMajors, jobTypes, courses };
}

const localId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

export const newEducation = (): CoachEducationDraft => ({
  id: localId("edu"),
  schoolName: "",
  academicDegreeId: "",
  universityMajorId: "",
  startDate: "",
  endDate: "",
  isStillEducation: false,
});

export const newCertificate = (): CoachCertificateDraft => ({
  id: localId("cert"),
  certificateName: "",
  organizationName: "",
  credentialId: "",
  issuedDate: "",
  expiryDate: "",
  credentialUrl: "",
});

export const newExperience = (): CoachExperienceDraft => ({
  id: localId("exp"),
  address: "",
  companyName: "",
  companyAddress: "",
  jobTypeId: "",
  startDate: "",
  endDate: "",
  isStillWorking: false,
});

export const newSkill = (): CoachSkillDraft => ({ id: localId("skill"), courseId: "", percentageScore: Number.NaN });

type Translate = (key: TranslationKey, values?: Readonly<Record<string, string | number>>) => string;

/** Error-summary labels for every entry, named as the form names them: "Education 2 — School or university". */
export function backgroundLabels(t: Translate, draft: CoachDraft): Record<string, string> {
  const labels: Record<string, string> = {};
  const add = (list: string, count: number, entry: TranslationKey, fields: Record<string, TranslationKey>) => {
    for (let index = 0; index < count; index += 1) {
      const prefix = `${t(entry, { number: String(index + 1) })} — `;
      for (const [field, label] of Object.entries(fields)) labels[`${list}.${index}.${field}`] = `${prefix}${t(label)}`;
    }
  };
  add("educations", draft.educations?.length ?? 0, "coaches.education", {
    schoolName: "coaches.schoolName",
    academicDegreeId: "coaches.academicDegree",
    universityMajorId: "coaches.universityMajor",
  });
  add("certificates", draft.certificates?.length ?? 0, "coaches.certificate", {
    certificateName: "coaches.certificateName",
    organizationName: "coaches.organizationName",
    credentialId: "coaches.credentialId",
    credentialUrl: "coaches.credentialUrl",
  });
  add("experiences", draft.experiences?.length ?? 0, "coaches.experience", {
    address: "coaches.jobTitle",
    companyName: "coaches.companyName",
    companyAddress: "coaches.companyAddress",
    jobTypeId: "coaches.jobType",
  });
  add("skills", draft.skills?.length ?? 0, "coaches.skill", {
    courseId: "coaches.skillCourse",
    percentageScore: "coaches.percentageScore",
  });
  return labels;
}
