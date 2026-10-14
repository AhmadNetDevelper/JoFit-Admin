import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { AppError, localize, notFound, nowIso, paginate, validationFailed } from "@/lib";
import { pushCatalogueImages, pushToStorefront } from "@/mocks/bridge";
import { mockCoaches } from "@/mocks/coaches";
import { mockCourseCategories, mockCourses, mockEnrolments } from "@/mocks/education";
import { checkGallery, readGallery } from "@/mocks/people/record-images";
import {
  daysFromToday,
  localizedValues,
  matchesAny,
  matchesText,
  nextId,
  simulateLatency,
  sortRows,
} from "@/mocks/runtime";
import { mockSports } from "@/mocks/sports";
import type { LocalizedText, Money, SortState } from "@/types";

import {
  COURSE_FORMATS,
  COURSE_LEVELS,
  allowedEnrolmentTransitions,
  type AdminCourse,
  type CourseCategory,
  type CourseCategoryDraft,
  type CourseCategorySortField,
  type CourseDraft,
  type CourseFormat,
  type CourseIntakeState,
  type CourseLevel,
  type CourseSortField,
  type Enrolment,
  type EnrolmentSortField,
} from "../types";
import type { EducationAdminService } from "./education.contract";

const MS_PER_DAY = 86_400_000;

/**
 * The storefront's intake rule, applied to live seat counts: full when no seat
 * is left, "upcoming" when the cohort is more than seven weeks out, "closing"
 * with three or fewer seats, otherwise open.
 */
function intakeState(startsOn: string, seatsTotal: number, seatsTaken: number): CourseIntakeState {
  const remaining = seatsTotal - seatsTaken;
  const daysAhead = Math.round((Date.parse(startsOn) - Date.parse(daysFromToday(0))) / MS_PER_DAY);
  if (remaining <= 0) return "full";
  if (daysAhead > 49) return "upcoming";
  if (remaining <= 3) return "closing";
  return "open";
}

/** Pending and active places hold a seat; completed and cancelled ones do not. */
const holdsSeat = (enrolment: Enrolment) => enrolment.status === "pending" || enrolment.status === "active";

/** A course with its seat count and enrolment total recomputed from the records. */
function withLiveCounts(course: AdminCourse): AdminCourse {
  const own = mockEnrolments.filter((enrolment) => enrolment.courseId === course.id);
  const seatsTaken = own.filter(
    (enrolment) => enrolment.cohortStartsOn === course.nextIntake.startsOn && holdsSeat(enrolment),
  ).length;
  return {
    ...course,
    nextIntake: {
      ...course.nextIntake,
      seatsTaken,
      state: intakeState(course.nextIntake.startsOn, course.nextIntake.seatsTotal, seatsTaken),
    },
    enrolmentCount: own.filter((enrolment) => enrolment.status !== "cancelled").length,
  };
}

function selectSortValue(course: AdminCourse, field: CourseSortField, locale: Locale): unknown {
  switch (field) {
    case "title":
      return localize(course.title, locale);
    case "status":
      return course.status;
    case "enrolmentCount":
      return course.enrolmentCount;
    case "updatedAt":
      return course.audit.updatedAt;
  }
}

function selectEnrolmentSort(enrolment: Enrolment, field: EnrolmentSortField): unknown {
  switch (field) {
    case "reference":
      return enrolment.reference;
    case "enrolledAt":
      return enrolment.enrolledAt;
    case "cohortStartsOn":
      return enrolment.cohortStartsOn;
    case "status":
      return enrolment.status;
  }
}

function requireCourse(id: string): { course: AdminCourse; index: number } {
  const index = mockCourses.findIndex((entry) => entry.id === id);
  const course = mockCourses[index];
  if (!course) throw notFound(`Course "${id}"`);
  return { course, index };
}

/* ------------------------------------------------ reading a posted draft */

/*
 * Read field by field, never spread: a body carrying `status: "published"` or
 * `enrolmentCount` must not reach the record through the edit endpoint. Missing
 * or mistyped values become blanks and NaN, which the validator reports on the
 * field they belong to.
 */
const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const num = (value: unknown): number => (typeof value === "number" ? value : Number.NaN);
const ids = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((entry): entry is string => typeof entry === "string"))] : [];

function text(value: unknown): LocalizedText {
  const raw = (value ?? {}) as Partial<Record<Locale, unknown>>;
  return { en: str(raw.en), ar: str(raw.ar) };
}

/** A localized value that may be absent altogether; blank in both languages counts as absent. */
function optionalText(value: unknown): LocalizedText | undefined {
  if (value === undefined || value === null) return undefined;
  const read = text(value);
  return read.en || read.ar ? read : undefined;
}

function money(value: unknown): Money {
  const raw = (value ?? {}) as Partial<Record<keyof Money, unknown>>;
  return { amount: num(raw.amount), currency: raw.currency as Money["currency"] };
}

const optionalMoney = (value: unknown): Money | undefined =>
  value === undefined || value === null ? undefined : money(value);

function readCourseDraft(input: CourseDraft): CourseDraft {
  const raw = (input ?? {}) as Partial<Record<keyof CourseDraft, unknown>>;
  const intake = (raw.nextIntake ?? {}) as Partial<Record<keyof CourseDraft["nextIntake"], unknown>>;
  const certification = (raw.certification ?? null) as { name?: unknown; issuedBy?: unknown } | null;
  return {
    slug: str(raw.slug),
    title: text(raw.title),
    summary: text(raw.summary),
    media: readGallery(raw.media),
    format: raw.format as CourseFormat,
    level: raw.level as CourseLevel,
    durationHours: num(raw.durationHours),
    price: money(raw.price),
    compareAtPrice: optionalMoney(raw.compareAtPrice),
    categoryIds: ids(raw.categoryIds),
    sportIds: ids(raw.sportIds),
    instructorIds: ids(raw.instructorIds),
    moduleCount: num(raw.moduleCount),
    certification: certification
      ? { name: text(certification.name), issuedBy: text(certification.issuedBy) }
      : undefined,
    languages: ids(raw.languages),
    // Only a course taught somewhere has a venue; one sent with an online course is dropped.
    venue: raw.format === "in-person" || raw.format === "hybrid" ? text(raw.venue) : undefined,
    nextIntake: { startsOn: str(intake.startsOn), seatsTotal: num(intake.seatsTotal) },
  };
}

/* ------------------------------------------------------------ validation */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function requireBoth(errors: Record<string, string>, key: string, value: LocalizedText, message = "Required."): void {
  for (const locale of LOCALES) if (!value[locale]) errors[`${key}.${locale}`] = message;
}

const isWhole = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
/** Integer minor units in dinars — a price is never a float, and never another currency here. */
const isPrice = (value: Money) => Number.isInteger(value.amount) && value.amount >= 0 && value.currency === "JOD";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The rules for a new course and an edit. `existing` is the course as it is now
 * (with live seat counts), so an edit can be held to what is already true of it:
 * a published course keeps every language, and a cohort people have seats on
 * cannot shrink below them or move to another date underneath them.
 */
function validateCourse(draft: CourseDraft, existing?: AdminCourse): void {
  const errors: Record<string, string> = {};
  requireBoth(errors, "title", draft.title);
  if (existing?.status === "published") {
    requireBoth(errors, "summary", draft.summary, "A published course needs a summary in every language.");
  }

  checkGallery(errors, "media", draft.media);

  if (!SLUG.test(draft.slug)) errors.slug = "Lower-case letters, numbers and hyphens, e.g. kettlebell-coaching.";
  else if (mockCourses.some((course) => course.slug === draft.slug && course.id !== existing?.id)) {
    errors.slug = "Another course already uses this address.";
  }

  if (!COURSE_FORMATS.includes(draft.format)) errors.format = "Choose online, in person, hybrid or self-paced.";
  if (!COURSE_LEVELS.includes(draft.level)) errors.level = "Choose a level.";
  if (!(Number.isFinite(draft.durationHours) && draft.durationHours > 0 && draft.durationHours <= 2000)) {
    errors.durationHours = "Hours of teaching, more than 0.";
  }
  if (!isWhole(draft.moduleCount, 0, 200)) errors.moduleCount = "A whole number of modules, from 0 to 200.";

  if (!isPrice(draft.price)) errors.price = "Enter the price in dinars, with up to three decimals.";
  if (draft.compareAtPrice && (!isPrice(draft.compareAtPrice) || draft.compareAtPrice.amount <= draft.price.amount)) {
    errors.compareAtPrice = "Higher than the price — or leave it empty.";
  }

  if (draft.categoryIds.length === 0) errors.categoryIds = "Choose at least one category.";
  else if (draft.categoryIds.some((id) => !mockCourseCategories.some((category) => category.id === id))) {
    errors.categoryIds = "One of these categories no longer exists.";
  }
  if (draft.sportIds?.some((id) => !mockSports.some((sport) => sport.id === id))) {
    errors.sportIds = "One of these sports no longer exists.";
  }
  if (draft.instructorIds.some((id) => !mockCoaches.some((coach) => coach.id === id))) {
    errors.instructorIds = "One of these instructors is no longer a coach here.";
  }
  if (draft.languages.length === 0) errors.languages = "Choose at least one language.";

  if (draft.format === "in-person" || draft.format === "hybrid") {
    requireBoth(errors, "venue", draft.venue ?? { en: "", ar: "" }, "An in-person or hybrid course needs a venue.");
  }
  if (draft.certification) {
    requireBoth(errors, "certification.name", draft.certification.name);
    requireBoth(errors, "certification.issuedBy", draft.certification.issuedBy);
  }

  const { startsOn, seatsTotal } = draft.nextIntake;
  const moved = !existing || existing.nextIntake.startsOn !== startsOn;
  const taken = existing?.nextIntake.seatsTaken ?? 0;
  if (!ISO_DATE.test(startsOn) || Number.isNaN(Date.parse(startsOn))) {
    errors["nextIntake.startsOn"] = "Choose the date the next cohort starts.";
  } else if (moved && startsOn < daysFromToday(0)) {
    errors["nextIntake.startsOn"] = "The next cohort cannot start in the past.";
  } else if (moved && taken > 0) {
    errors["nextIntake.startsOn"] =
      `${plural(taken, "person holds a seat", "people hold seats")} on the cohort starting ${existing!.nextIntake.startsOn}. Cancel or complete those places before moving it.`;
  }
  if (!isWhole(seatsTotal, 1, 1000)) errors["nextIntake.seatsTotal"] = "A whole number of seats, from 1 to 1000.";
  else if (!moved && seatsTotal < taken) {
    errors["nextIntake.seatsTotal"] = `${plural(taken, "seat is", "seats are")} already taken on this cohort.`;
  }

  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

/** The course fields a validated draft sets — everything but the intake, which is merged. */
function fieldsOf(draft: CourseDraft) {
  const { nextIntake: _intake, ...fields } = draft;
  return fields;
}

/* ------------------------------------------------------------ categories */

const coursesUnder = (categoryId: string) =>
  mockCourses.filter((course) => course.categoryIds.includes(categoryId)).length;

const withCourseCount = (category: Omit<CourseCategory, "courseCount">): CourseCategory => ({
  ...category,
  courseCount: coursesUnder(category.id),
});

function readCategoryDraft(input: CourseCategoryDraft): CourseCategoryDraft {
  const raw = (input ?? {}) as Partial<Record<keyof CourseCategoryDraft, unknown>>;
  return { slug: str(raw.slug), name: text(raw.name), description: optionalText(raw.description) };
}

function validateCategory(draft: CourseCategoryDraft, id?: string): void {
  const errors: Record<string, string> = {};
  requireBoth(errors, "name", draft.name);
  if (!SLUG.test(draft.slug)) errors.slug = "Lower-case letters, numbers and hyphens, e.g. certifications.";
  else if (mockCourseCategories.some((category) => category.slug === draft.slug && category.id !== id)) {
    errors.slug = "Another category already uses this address.";
  }
  // Half a description would print on one storefront and leave the other blank.
  if (draft.description) {
    requireBoth(errors, "description", draft.description, "Write it in both languages, or leave both empty.");
  }
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

function selectCategorySort(category: CourseCategory, field: CourseCategorySortField, locale: Locale): unknown {
  switch (field) {
    case "name":
      return localize(category.name, locale);
    case "slug":
      return category.slug;
    case "courseCount":
      return category.courseCount;
  }
}

function requireCategory(id: string): number {
  const index = mockCourseCategories.findIndex((category) => category.id === id);
  if (index < 0) throw notFound(`Course category "${id}"`);
  return index;
}

export const mockEducationAdminService: EducationAdminService = {
  async listCourses(query = {}) {
    await simulateLatency();
    const filtered = mockCourses.map(withLiveCounts).filter((course) => {
      const searchable = [...localizedValues(course.title), ...localizedValues(course.summary), course.slug];
      if (!matchesText(searchable, query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(course.status)) return false;
      if (!matchesAny([...course.categoryIds], query.categoryIds)) return false;
      if (query.instructorId && !course.instructorIds.includes(query.instructorId)) return false;
      return true;
    });
    const locale = query.locale ?? DEFAULT_LOCALE;
    const sort: SortState<CourseSortField> = query.sort ?? { field: "title", direction: "asc" };
    const sorted = sortRows(filtered, (course) => selectSortValue(course, sort.field, locale), sort.direction);
    return paginate(sorted, query);
  },

  async getCourse(id) {
    await simulateLatency();
    const course = mockCourses.find((entry) => entry.id === id);
    return course ? withLiveCounts(course) : null;
  },

  async createCourse(input) {
    await simulateLatency();
    const draft = readCourseDraft(input);
    validateCourse(draft);
    const now = nowIso();
    const baseId = `course-${draft.slug}`;
    const course: AdminCourse = {
      ...fieldsOf(draft),
      id: mockCourses.some((entry) => entry.id === baseId) ? nextId("course") : baseId,
      nextIntake: { ...draft.nextIntake, seatsTaken: 0, state: "open" },
      enrolmentCount: 0,
      rating: { average: 0, count: 0 },
      // Off the site until someone publishes it — which needs every language.
      status: "draft",
      audit: { createdAt: now, createdBy: "staff", updatedAt: now, updatedBy: "staff" },
    };
    mockCourses.push(course);
    /* Pictures reach the storefront; the rest of the course does not (`pushCatalogueImages`). */
    pushCatalogueImages("course", course.id, ["media"], undefined, course);
    return withLiveCounts(course);
  },

  async updateCourse(id, input) {
    await simulateLatency();
    const { course, index } = requireCourse(id);
    const draft = readCourseDraft(input);
    validateCourse(draft, withLiveCounts(course));
    const updated: AdminCourse = {
      ...course,
      ...fieldsOf(draft),
      nextIntake: { ...course.nextIntake, ...draft.nextIntake },
      audit: { ...course.audit, updatedAt: nowIso(), updatedBy: "staff" },
    };
    mockCourses[index] = updated;
    pushCatalogueImages("course", id, ["media"], course, updated);
    // Enrolments carry the course title for their list; keep it current.
    mockEnrolments.forEach((enrolment, position) => {
      if (enrolment.courseId === id) mockEnrolments[position] = { ...enrolment, courseTitle: updated.title };
    });
    return withLiveCounts(updated);
  },

  async deleteCourse(id) {
    await simulateLatency();
    const { index } = requireCourse(id);
    const live = mockEnrolments.filter((enrolment) => enrolment.courseId === id && holdsSeat(enrolment)).length;
    if (live > 0) {
      throw new AppError(
        "conflict",
        `${plural(live, "person holds", "people hold")} a pending or active place on this course. Cancel or complete those enrolments first.`,
        { status: 409 },
      );
    }
    mockCourses.splice(index, 1);
  },

  async setCourseStatus(id, status) {
    await simulateLatency();
    const { course, index } = requireCourse(id);
    // The same publishing rule as products and articles: every language first.
    if (status === "published") {
      const errors: Record<string, string> = {};
      requireBoth(errors, "title", course.title, "A published course needs a title in every language.");
      requireBoth(errors, "summary", course.summary, "A published course needs a summary in every language.");
      if (Object.keys(errors).length > 0) throw validationFailed(errors);
    }
    const updated: AdminCourse = {
      ...course,
      status,
      audit: { ...course.audit, updatedAt: nowIso(), updatedBy: "admin-2" },
    };
    mockCourses[index] = updated;
    return withLiveCounts(updated);
  },

  async listCategories() {
    await simulateLatency();
    return mockCourseCategories.map(withCourseCount);
  },

  async listCategoriesPage(query = {}) {
    await simulateLatency();
    const filtered = mockCourseCategories
      .map(withCourseCount)
      .filter((category) => matchesText([...localizedValues(category.name), category.slug], query.search));
    const locale = query.locale ?? DEFAULT_LOCALE;
    const sort = (query.sort ?? { field: "name", direction: "asc" }) as SortState<CourseCategorySortField>;
    const sorted = sortRows(filtered, (category) => selectCategorySort(category, sort.field, locale), sort.direction);
    return paginate(sorted, query);
  },

  async createCategory(input) {
    await simulateLatency();
    const draft = readCategoryDraft(input);
    validateCategory(draft);
    const baseId = `ccat-${draft.slug}`;
    const category = {
      ...draft,
      id: mockCourseCategories.some((entry) => entry.id === baseId) ? nextId("ccat") : baseId,
    };
    mockCourseCategories.push(category);
    return withCourseCount(category);
  },

  async updateCategory(id, input) {
    await simulateLatency();
    const index = requireCategory(id);
    const draft = readCategoryDraft(input);
    validateCategory(draft, id);
    const category = { ...draft, id };
    mockCourseCategories[index] = category;
    return withCourseCount(category);
  },

  async deleteCategory(id) {
    await simulateLatency();
    const index = requireCategory(id);
    const count = coursesUnder(id);
    if (count > 0) {
      throw new AppError(
        "conflict",
        `${plural(count, "course is", "courses are")} filed under this category. Move ${count === 1 ? "it" : "them"} to another category first.`,
        { status: 409 },
      );
    }
    mockCourseCategories.splice(index, 1);
  },

  async listEnrolments(query = {}) {
    await simulateLatency();
    const filtered = mockEnrolments.filter((enrolment) => {
      const searchable = [
        enrolment.reference,
        enrolment.customerName,
        enrolment.customerEmail,
        ...localizedValues(enrolment.courseTitle),
      ];
      if (!matchesText(searchable, query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(enrolment.status)) return false;
      if (query.courseId && enrolment.courseId !== query.courseId) return false;
      if (query.customerId && enrolment.customerId !== query.customerId) return false;
      if (query.cohortStartsOn && enrolment.cohortStartsOn !== query.cohortStartsOn) return false;
      if (query.excludeCohortStartsOn && enrolment.cohortStartsOn === query.excludeCohortStartsOn) return false;
      return true;
    });
    const sorted = query.sort
      ? sortRows(filtered, (e) => selectEnrolmentSort(e, query.sort!.field), query.sort.direction)
      : sortRows(filtered, (e) => e.enrolledAt, "desc");
    return paginate(sorted, query);
  },

  async setEnrolmentStatus(id, status, note) {
    await simulateLatency();
    const index = mockEnrolments.findIndex((enrolment) => enrolment.id === id);
    const enrolment = mockEnrolments[index];
    if (!enrolment) throw notFound(`Enrolment "${id}"`);
    if (!allowedEnrolmentTransitions(enrolment.status).includes(status)) {
      throw new AppError(
        "conflict",
        `An enrolment that is "${enrolment.status}" cannot move to "${status}".`,
      );
    }
    if (status === "cancelled" && !note?.trim()) {
      throw validationFailed({ note: "Record why the place was cancelled." });
    }
    const course = mockCourses.find((entry) => entry.id === enrolment.courseId);
    const updated: Enrolment = {
      ...enrolment,
      status,
      progressPercent: status === "completed" ? 100 : enrolment.progressPercent,
      // Activating a seat is what confirms payment for it.
      amountPaid: status === "active" && course ? course.price : enrolment.amountPaid,
      statusNote: note?.trim() || enrolment.statusNote,
      // `Enrolment.audit` is optional today (the live DTO has none) — the mock fixtures always have one.
      audit: enrolment.audit ? { ...enrolment.audit, updatedAt: nowIso(), updatedBy: "admin-2" } : undefined,
    };
    mockEnrolments[index] = updated;
    pushToStorefront("enrolment", id, {
      status,
      statusNote: updated.statusNote,
      amountPaid: updated.amountPaid,
      progressPercent: updated.progressPercent,
    });
    return updated;
  },
};
