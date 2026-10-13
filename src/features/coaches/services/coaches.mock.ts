import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { AppError, localize, notFound, nowIso, paginate, validationFailed } from "@/lib";
import { pushCatalogueImages, pushToStorefront } from "@/mocks/bridge";
import { mockCoachBookings, mockCoachLocations, mockCoaches, mockSpecialisations } from "@/mocks/coaches";
import { mockCourses } from "@/mocks/education";
import { mockLookups } from "@/mocks/lookups";
import { checkGallery, checkImage, readGallery, readImage } from "@/mocks/people/record-images";
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
  COACH_SESSION_MODES,
  allowedCoachBookingTransitions,
  type AdminCoach,
  type CoachBooking,
  type CoachBookingSortField,
  type CoachCertificateDraft,
  type CoachDraft,
  type CoachEducationDraft,
  type CoachExperienceDraft,
  type CoachPackage,
  type CoachSessionMode,
  type CoachSkillDraft,
  type CoachSortField,
  type CoachSpecialisation,
  type CoachSpecialisationDraft,
  type CoachSpecialisationSortField,
} from "../types";
import type { CoachesAdminService } from "./coaches.contract";
import { coachDraftProblems } from "./coaches.rules";

function requireCoach(id: string): { coach: AdminCoach; index: number } {
  const index = mockCoaches.findIndex((entry) => entry.id === id);
  const coach = mockCoaches[index];
  if (!coach) throw notFound(`Coach "${id}"`);
  return { coach, index };
}

function selectSortValue(coach: AdminCoach, field: CoachSortField, locale: Locale): unknown {
  switch (field) {
    case "name":
      return localize(coach.name, locale);
    case "verificationStatus":
      return coach.verificationStatus;
    case "rating":
      return coach.rating.average;
    case "updatedAt":
      return coach.audit.updatedAt;
  }
}

function selectBookingSort(booking: CoachBooking, field: CoachBookingSortField): unknown {
  switch (field) {
    case "reference":
      return booking.reference;
    case "startsAt":
      return booking.startsAt;
    case "status":
      return booking.status;
    case "total":
      return booking.total.amount;
  }
}

/* ------------------------------------------------ reading a posted draft */

/*
 * A draft arrives from a form or, through the mock API, from any HTTP client —
 * so it is read field by field rather than spread. Spreading would let a body
 * carrying `verificationStatus: "approved"` approve a coach through the profile
 * endpoint. Missing or mistyped values become blanks and NaN, which the
 * validator then reports on the field they belong to.
 */
const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const num = (value: unknown): number => (typeof value === "number" ? value : Number.NaN);
const ids = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((entry): entry is string => typeof entry === "string"))] : [];

function text(value: unknown): LocalizedText {
  const raw = (value ?? {}) as Partial<Record<Locale, unknown>>;
  return { en: str(raw.en), ar: str(raw.ar) };
}

/** Blank in both languages reads as "none". */
function optionalText(value: unknown): LocalizedText | undefined {
  const read = text(value);
  return read.en || read.ar ? read : undefined;
}

const entries = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const fields = <T,>(value: unknown) => (value ?? {}) as Partial<Record<keyof T, unknown>>;

function readEducation(value: unknown): CoachEducationDraft {
  const raw = fields<CoachEducationDraft>(value);
  return {
    id: str(raw.id),
    schoolName: str(raw.schoolName),
    academicDegreeId: str(raw.academicDegreeId),
    universityMajorId: str(raw.universityMajorId),
    startDate: str(raw.startDate),
    endDate: str(raw.endDate),
    isStillEducation: raw.isStillEducation === true,
  };
}

function readCertificate(value: unknown): CoachCertificateDraft {
  const raw = fields<CoachCertificateDraft>(value);
  return {
    id: str(raw.id),
    certificateName: str(raw.certificateName),
    organizationName: str(raw.organizationName),
    credentialId: str(raw.credentialId),
    issuedDate: str(raw.issuedDate),
    expiryDate: str(raw.expiryDate),
    credentialUrl: str(raw.credentialUrl),
    certificateFile: raw.certificateFile instanceof File ? raw.certificateFile : undefined,
  };
}

function readExperience(value: unknown): CoachExperienceDraft {
  const raw = fields<CoachExperienceDraft>(value);
  return {
    id: str(raw.id),
    address: str(raw.address),
    companyName: str(raw.companyName),
    companyAddress: str(raw.companyAddress),
    jobTypeId: str(raw.jobTypeId),
    startDate: str(raw.startDate),
    endDate: str(raw.endDate),
    isStillWorking: raw.isStillWorking === true,
  };
}

function readSkill(value: unknown): CoachSkillDraft {
  const raw = fields<CoachSkillDraft>(value);
  return { id: str(raw.id), courseId: str(raw.courseId), percentageScore: num(raw.percentageScore) };
}

function money(value: unknown): Money {
  const raw = (value ?? {}) as Partial<Record<keyof Money, unknown>>;
  return { amount: num(raw.amount), currency: raw.currency as Money["currency"] };
}

const optionalMoney = (value: unknown): Money | undefined =>
  value === undefined || value === null ? undefined : money(value);

function readPackage(value: unknown): CoachPackage {
  const raw = (value ?? {}) as Partial<Record<keyof CoachPackage, unknown>>;
  return {
    id: str(raw.id),
    name: text(raw.name),
    durationMinutes: num(raw.durationMinutes),
    sessionCount: num(raw.sessionCount),
    mode: raw.mode as CoachSessionMode,
    price: money(raw.price),
    compareAtPrice: optionalMoney(raw.compareAtPrice),
  };
}

function readCoachDraft(input: CoachDraft): CoachDraft {
  const raw = (input ?? {}) as Partial<Record<keyof CoachDraft, unknown>>;
  /* Package ids are the form's own; a missing or repeated one gets a fresh id
     so a booking can never point at two packages. */
  const seen = new Set<string>();
  const packages = (Array.isArray(raw.packages) ? raw.packages : []).map((entry) => {
    const pkg = readPackage(entry);
    const id = pkg.id && !seen.has(pkg.id) ? pkg.id : nextId("pkg");
    seen.add(id);
    return { ...pkg, id };
  });
  return {
    slug: str(raw.slug),
    name: text(raw.name),
    email: str(raw.email),
    headline: text(raw.headline),
    bio: optionalText(raw.bio),
    userName: str(raw.userName),
    phoneNumber: str(raw.phoneNumber),
    /* Never trimmed: spaces are part of a password. */
    password: typeof raw.password === "string" ? raw.password : undefined,
    educations: entries(raw.educations).map(readEducation),
    certificates: entries(raw.certificates).map(readCertificate),
    experiences: entries(raw.experiences).map(readExperience),
    skills: entries(raw.skills).map(readSkill),
    avatar: readImage(raw.avatar),
    gallery: readGallery(raw.gallery),
    sportIds: ids(raw.sportIds),
    specializations: ids(raw.specializations),
    yearsOfExperience: num(raw.yearsOfExperience),
    languages: ids(raw.languages),
    locationId: str(raw.locationId),
    isRemoteAvailable: raw.isRemoteAvailable === true,
    sessionRate: optionalMoney(raw.sessionRate),
    responseTimeHours: num(raw.responseTimeHours),
    packages,
  };
}

/* ------------------------------------------------------------ validation */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireBoth(errors: Record<string, string>, key: string, value: LocalizedText): void {
  for (const locale of LOCALES) if (!value[locale]) errors[`${key}.${locale}`] = "Required.";
}

const isWhole = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
/** Integer minor units in dinars — a price is never a float, and never another currency here. */
const isPrice = (value: Money) => Number.isInteger(value.amount) && value.amount >= 0 && value.currency === "JOD";

/** A chosen reference id that is not (or no longer) in its table. */
function checkReference(
  errors: Record<string, string>,
  key: string,
  kind: "academic-degree" | "university-major" | "job-type" | "course",
  id: string,
): void {
  if (id && !mockLookups[kind].some((entry) => entry.id === id)) errors[key] ??= "This choice no longer exists.";
}

function validateCoach(draft: CoachDraft, id?: string): void {
  const errors: Record<string, string> = coachDraftProblems(draft, id ? "update" : "create");
  if (!id) {
    draft.educations?.forEach((entry, index) => {
      checkReference(errors, `educations.${index}.academicDegreeId`, "academic-degree", entry.academicDegreeId);
      checkReference(errors, `educations.${index}.universityMajorId`, "university-major", entry.universityMajorId);
    });
    draft.experiences?.forEach((entry, index) => {
      checkReference(errors, `experiences.${index}.jobTypeId`, "job-type", entry.jobTypeId);
    });
    draft.skills?.forEach((entry, index) => {
      checkReference(errors, `skills.${index}.courseId`, "course", entry.courseId);
    });
  }
  requireBoth(errors, "name", draft.name);
  requireBoth(errors, "headline", draft.headline);

  if (!SLUG.test(draft.slug)) errors.slug = "Lower-case letters, numbers and hyphens, e.g. layla-haddad.";
  else if (mockCoaches.some((coach) => coach.slug === draft.slug && coach.id !== id)) {
    errors.slug = "Another coach already uses this address.";
  }
  checkImage(errors, "avatar", draft.avatar);
  checkGallery(errors, "gallery", draft.gallery);
  if (!EMAIL.test(draft.email)) errors.email = "Enter an email address, e.g. name@example.com.";
  else if (mockCoaches.some((coach) => coach.email.toLowerCase() === draft.email.toLowerCase() && coach.id !== id)) {
    errors.email = "Another coach already uses this email.";
  }

  if (!mockCoachLocations.some((location) => location.id === draft.locationId)) {
    errors.locationId = "Choose where the coach is based.";
  }
  if (draft.sportIds.length === 0) errors.sportIds = "Choose at least one sport.";
  else if (draft.sportIds.some((sportId) => !mockSports.some((sport) => sport.id === sportId))) {
    errors.sportIds = "One of these sports no longer exists.";
  }
  if (draft.specializations.some((specId) => !mockSpecialisations.some((entry) => entry.id === specId))) {
    errors.specializations = "One of these specialisations no longer exists.";
  }
  if (draft.languages.length === 0) errors.languages = "Choose at least one language.";

  if (!isWhole(draft.yearsOfExperience, 0, 60)) errors.yearsOfExperience = "A whole number of years, from 0 to 60.";
  if (!isWhole(draft.responseTimeHours, 1, 168)) errors.responseTimeHours = "A whole number of hours, from 1 to 168.";
  if (draft.sessionRate && !isPrice(draft.sessionRate)) {
    errors.sessionRate = "A price in dinars, with up to three decimals — or leave it empty.";
  }

  draft.packages.forEach((pkg, index) => {
    const key = `packages.${index}`;
    requireBoth(errors, `${key}.name`, pkg.name);
    if (!isWhole(pkg.durationMinutes, 5, 600)) errors[`${key}.durationMinutes`] = "Whole minutes, from 5 to 600.";
    if (!isWhole(pkg.sessionCount, 1, 100)) errors[`${key}.sessionCount`] = "A whole number of sessions, from 1 to 100.";
    if (!COACH_SESSION_MODES.includes(pkg.mode)) errors[`${key}.mode`] = "Choose in person or online.";
    if (!isPrice(pkg.price)) errors[`${key}.price`] = "A price in dinars, with up to three decimals.";
    if (pkg.compareAtPrice && (!isPrice(pkg.compareAtPrice) || pkg.compareAtPrice.amount <= pkg.price.amount)) {
      errors[`${key}.compareAtPrice`] = "Higher than the price — or leave it empty.";
    }
  });

  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

/**
 * The profile fields of a validated draft, with the venue resolved from its id.
 * The login and the background are not part of the profile, and are not kept —
 * the live API does not return them either.
 */
function profileOf(draft: CoachDraft) {
  return {
    slug: draft.slug,
    name: draft.name,
    email: draft.email,
    headline: draft.headline,
    bio: draft.bio,
    avatar: draft.avatar,
    gallery: draft.gallery,
    sportIds: draft.sportIds,
    specializations: draft.specializations,
    yearsOfExperience: draft.yearsOfExperience,
    languages: draft.languages,
    location: mockCoachLocations.find((location) => location.id === draft.locationId)!,
    isRemoteAvailable: draft.isRemoteAvailable,
    sessionRate: draft.sessionRate,
    packages: draft.packages,
    responseTimeHours: draft.responseTimeHours,
  };
}

/* ------------------------------------------------------- specialisations */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const coachesListing = (specId: string) =>
  mockCoaches.filter((coach) => coach.specializations.includes(specId)).length;

const withCoachCount = (entry: Omit<CoachSpecialisation, "coachCount">): CoachSpecialisation => ({
  ...entry,
  coachCount: coachesListing(entry.id),
});

function validateSpecialisation(draft: CoachSpecialisationDraft, id?: string): void {
  const errors: Record<string, string> = {};
  requireBoth(errors, "name", draft.name);
  for (const locale of LOCALES) {
    const name = draft.name[locale].toLowerCase();
    if (name && mockSpecialisations.some((entry) => entry.id !== id && entry.name[locale].toLowerCase() === name)) {
      errors[`name.${locale}`] = "Another specialisation already has this name.";
    }
  }
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
}

function selectSpecialisationSort(
  entry: CoachSpecialisation,
  field: CoachSpecialisationSortField,
  locale: Locale,
): unknown {
  return field === "coachCount" ? entry.coachCount : localize(entry.name, locale);
}

function requireSpecialisation(id: string): number {
  const index = mockSpecialisations.findIndex((entry) => entry.id === id);
  if (index < 0) throw notFound(`Specialisation "${id}"`);
  return index;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export const mockCoachesAdminService: CoachesAdminService = {
  async listCoaches(query = {}) {
    await simulateLatency();
    const filtered = mockCoaches.filter((coach) => {
      const searchable = [
        ...localizedValues(coach.name),
        ...localizedValues(coach.headline),
        coach.slug,
        coach.email,
      ];
      if (!matchesText(searchable, query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(coach.verificationStatus)) return false;
      if (!matchesAny([...coach.sportIds], query.sportIds)) return false;
      return true;
    });
    const locale = query.locale ?? DEFAULT_LOCALE;
    const sort: SortState<CoachSortField> = query.sort ?? { field: "name", direction: "asc" };
    const sorted = sortRows(filtered, (c) => selectSortValue(c, sort.field, locale), sort.direction);
    return paginate(sorted, query);
  },

  async getCoach(id) {
    await simulateLatency();
    return mockCoaches.find((coach) => coach.id === id) ?? null;
  },

  async createCoach(input) {
    await simulateLatency();
    const draft = readCoachDraft(input);
    validateCoach(draft);
    const now = nowIso();
    const baseId = `coach-${draft.slug}`;
    const coach: AdminCoach = {
      ...profileOf(draft),
      id: mockCoaches.some((entry) => entry.id === baseId) ? nextId("coach") : baseId,
      certifications: [],
      completedSessions: 0,
      rating: { average: 0, count: 0 },
      // Added by staff or not, a profile is listed only once someone approves it.
      verificationStatus: "pending",
      audit: { createdAt: now, createdBy: "staff", updatedAt: now, updatedBy: "staff" },
    };
    mockCoaches.push(coach);
    /* Pictures reach the storefront; the rest of the profile does not (`pushCatalogueImages`). */
    pushCatalogueImages("coach", coach.id, ["avatar", "gallery"], undefined, coach);
    return coach;
  },

  async updateCoach(id, input) {
    await simulateLatency();
    const { coach, index } = requireCoach(id);
    const draft = readCoachDraft(input);
    validateCoach(draft, id);
    const updated: AdminCoach = {
      ...coach,
      ...profileOf(draft),
      audit: { ...coach.audit, updatedAt: nowIso(), updatedBy: "staff" },
    };
    mockCoaches[index] = updated;
    pushCatalogueImages("coach", id, ["avatar", "gallery"], coach, updated);
    // Sessions carry the coach's name so the queue reads without a join; keep it current.
    mockCoachBookings.forEach((booking, position) => {
      if (booking.coachId === id) mockCoachBookings[position] = { ...booking, coachName: updated.name };
    });
    return updated;
  },

  async deleteCoach(id) {
    await simulateLatency();
    const { index } = requireCoach(id);
    const sessions = mockCoachBookings.filter(
      (booking) => booking.coachId === id && (booking.status === "pending" || booking.status === "confirmed"),
    ).length;
    const courses = mockCourses.filter((course) => course.instructorIds.includes(id)).length;
    if (sessions > 0 || courses > 0) {
      const owes = [
        sessions > 0 ? `has ${plural(sessions, "pending or confirmed session", "pending or confirmed sessions")}` : "",
        courses > 0 ? `teaches ${plural(courses, "course", "courses")}` : "",
      ].filter(Boolean);
      const fix = [
        sessions > 0 ? "complete or cancel the sessions" : "",
        courses > 0 ? `give ${courses === 1 ? "the course" : "those courses"} another instructor` : "",
      ].filter(Boolean);
      throw new AppError("conflict", `This coach still ${owes.join(" and ")}. First ${fix.join(" and ")}.`, {
        status: 409,
      });
    }
    mockCoaches.splice(index, 1);
  },

  async decideVerification({ coachId, status, note }) {
    await simulateLatency();
    // A refusal must be explainable — the coach is told why.
    if ((status === "rejected" || status === "suspended") && !note?.trim()) {
      throw validationFailed({ note: "Give a reason so the coach can be told why." });
    }
    const { coach, index } = requireCoach(coachId);
    const updated: AdminCoach = {
      ...coach,
      verificationStatus: status,
      statusNote: note?.trim() || undefined,
      audit: { ...coach.audit, updatedAt: nowIso(), updatedBy: "admin-2" },
    };
    mockCoaches[index] = updated;
    return updated;
  },

  async setCertificationVerified(coachId, certificationId, isVerified) {
    await simulateLatency();
    const { coach, index } = requireCoach(coachId);
    const updated: AdminCoach = {
      ...coach,
      certifications: coach.certifications.map((certification) =>
        certification.id === certificationId ? { ...certification, isVerified } : certification,
      ),
      audit: { ...coach.audit, updatedAt: nowIso(), updatedBy: "admin-2" },
    };
    mockCoaches[index] = updated;
    return updated;
  },

  async listLocations() {
    await simulateLatency();
    return mockCoachLocations;
  },

  async listSpecialisations() {
    await simulateLatency();
    return mockSpecialisations.map(withCoachCount);
  },

  async listSpecialisationsPage(query = {}) {
    await simulateLatency();
    const filtered = mockSpecialisations
      .map(withCoachCount)
      .filter((entry) => matchesText([...localizedValues(entry.name), entry.id], query.search));
    const locale = query.locale ?? DEFAULT_LOCALE;
    const sort = (query.sort ?? { field: "name", direction: "asc" }) as SortState<CoachSpecialisationSortField>;
    const sorted = sortRows(filtered, (entry) => selectSpecialisationSort(entry, sort.field, locale), sort.direction);
    return paginate(sorted, query);
  },

  async createSpecialisation(input) {
    await simulateLatency();
    const draft: CoachSpecialisationDraft = { name: text(input?.name) };
    validateSpecialisation(draft);
    const base = `spec-${slugify(draft.name.en)}`;
    const id = base === "spec-" || mockSpecialisations.some((entry) => entry.id === base) ? nextId("spec") : base;
    const entry = { id, name: draft.name };
    mockSpecialisations.push(entry);
    return withCoachCount(entry);
  },

  async updateSpecialisation(id, input) {
    await simulateLatency();
    const index = requireSpecialisation(id);
    const draft: CoachSpecialisationDraft = { name: text(input?.name) };
    validateSpecialisation(draft, id);
    const entry = { id, name: draft.name };
    mockSpecialisations[index] = entry;
    return withCoachCount(entry);
  },

  async deleteSpecialisation(id) {
    await simulateLatency();
    const index = requireSpecialisation(id);
    const count = coachesListing(id);
    if (count > 0) {
      throw new AppError(
        "conflict",
        `${plural(count, "coach lists", "coaches list")} this specialisation. Remove it from their profiles first.`,
        { status: 409 },
      );
    }
    mockSpecialisations.splice(index, 1);
  },

  async listBookings(query = {}) {
    await simulateLatency();
    const today = daysFromToday(0);
    const filtered = mockCoachBookings.filter((booking) => {
      const searchable = [
        booking.reference,
        booking.contact.name,
        booking.contact.email,
        ...localizedValues(booking.coachName),
      ];
      if (!matchesText(searchable, query.search)) return false;
      if (query.statuses?.length && !query.statuses.includes(booking.status)) return false;
      if (query.coachId && booking.coachId !== query.coachId) return false;
      if (query.customerId && booking.customerId !== query.customerId) return false;
      if (query.upcomingOnly && booking.startsAt.slice(0, 10) < today) return false;
      return true;
    });
    const sorted = query.sort
      ? sortRows(filtered, (b) => selectBookingSort(b, query.sort!.field), query.sort.direction)
      : sortRows(filtered, (b) => b.startsAt, "desc");
    return paginate(sorted, query);
  },

  async getBooking(id) {
    await simulateLatency();
    return mockCoachBookings.find((booking) => booking.id === id) ?? null;
  },

  async setBookingStatus(id, status, note) {
    await simulateLatency();
    const index = mockCoachBookings.findIndex((booking) => booking.id === id);
    const booking = mockCoachBookings[index];
    if (!booking) throw notFound(`Coach booking "${id}"`);
    if (!allowedCoachBookingTransitions(booking.status).includes(status)) {
      throw new AppError(
        "conflict",
        `A booking that is "${booking.status}" cannot move to "${status}".`,
      );
    }
    // The customer is told why a session they paid for is not happening.
    if (status === "cancelled" && !note?.trim()) {
      throw validationFailed({ note: "Give a reason so the customer can be told why." });
    }
    const updated: CoachBooking = {
      ...booking,
      status,
      statusNote: note?.trim() || booking.statusNote,
      audit: { ...booking.audit, updatedAt: nowIso(), updatedBy: "admin-2" },
    };
    mockCoachBookings[index] = updated;
    pushToStorefront("session", id, { status, statusNote: updated.statusNote });
    return updated;
  },
};
