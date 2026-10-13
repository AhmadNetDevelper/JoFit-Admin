import { LOCALES } from "@/i18n/locales";

import type { CoachDraft } from "../types";

type Errors = Record<string, string>;

function checkText(errors: Errors, key: string, value: string, max: number, required = false): void {
  const trimmed = value.trim();
  if (required && !trimmed) errors[key] = "Required.";
  else if (trimmed.length > max) errors[key] = `At most ${max} characters.`;
}

/**
 * The live API's limits on the login, the bio and the background lists of
 * `POST`/`PUT /v1/admin/coaches` (docs/api-live/admin.json), keyed the way the
 * form names its fields. Both adapters run it before saving: the live API
 * reports a breach against its own multipart paths (`User.UserName`,
 * `Educations[0].SchoolName`), which no field on the form carries.
 */
export function coachDraftProblems(draft: CoachDraft, mode: "create" | "update"): Errors {
  const errors: Errors = {};
  const isNew = mode === "create";

  const userName = draft.userName.trim();
  if (isNew && !userName) errors.userName = "Required.";
  else if (userName && (userName.length < 3 || userName.length > 256)) {
    errors.userName = "From 3 to 256 characters.";
  }

  if (isNew) {
    const password = draft.password ?? "";
    if (!password) errors.password = "Required.";
    else if (password.length < 6 || password.length > 256) errors.password = "From 6 to 256 characters.";
  }

  const phone = draft.phoneNumber.trim();
  if (phone.length > 256) errors.phoneNumber = "At most 256 characters.";
  else if (isNew && phone && phone.length < 6) errors.phoneNumber = "At least 6 characters — or leave it empty.";

  for (const locale of LOCALES) checkText(errors, `bio.${locale}`, draft.bio?.[locale] ?? "", 200);

  if (!isNew) return errors;

  draft.educations?.forEach((entry, index) => {
    checkText(errors, `educations.${index}.schoolName`, entry.schoolName, 100, true);
  });
  draft.certificates?.forEach((entry, index) => {
    const key = `certificates.${index}`;
    checkText(errors, `${key}.certificateName`, entry.certificateName, 100, true);
    checkText(errors, `${key}.organizationName`, entry.organizationName, 100, true);
    checkText(errors, `${key}.credentialId`, entry.credentialId, 100, true);
    checkText(errors, `${key}.credentialUrl`, entry.credentialUrl, 500);
  });
  draft.experiences?.forEach((entry, index) => {
    const key = `experiences.${index}`;
    checkText(errors, `${key}.address`, entry.address, 300, true);
    checkText(errors, `${key}.companyName`, entry.companyName, 100, true);
    checkText(errors, `${key}.companyAddress`, entry.companyAddress, 100, true);
  });
  draft.skills?.forEach((entry, index) => {
    const key = `skills.${index}`;
    if (!entry.courseId) errors[`${key}.courseId`] = "Choose a course.";
    const score = entry.percentageScore;
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      errors[`${key}.percentageScore`] = "A whole number from 0 to 100.";
    }
  });

  return errors;
}
