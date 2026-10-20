import type { CourseFormat, CourseIntakeStatus, CourseLevel } from "@/features/education";
import type { TranslationKey } from "@/i18n";

/** Format and level in the reader's language — in the course form, list and detail alike. */
export const FORMAT_LABEL: Readonly<Record<CourseFormat, TranslationKey>> = {
  online: "courses.format.online",
  "in-person": "courses.format.in-person",
  hybrid: "courses.format.hybrid",
  "self-paced": "courses.format.self-paced",
};

/** The choices for a course's next intake: automatic, or one the storefront is told to show. */
export const INTAKE_STATUS_LABEL: Readonly<Record<CourseIntakeStatus, TranslationKey>> = {
  auto: "courses.intakeStatus.auto",
  soon: "courses.intakeStatus.soon",
  open: "courses.intakeStatus.open",
  full: "courses.intakeStatus.full",
};

export const LEVEL_LABEL: Readonly<Record<CourseLevel, TranslationKey>> = {
  beginner: "courses.level.beginner",
  intermediate: "courses.level.intermediate",
  advanced: "courses.level.advanced",
};
