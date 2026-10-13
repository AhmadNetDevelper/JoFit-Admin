import { AppError, validationFailed } from "@/lib";
import { adminListParams, httpClient, orNull } from "@/services";
import type {
  AuditInfo,
  CurrencyCode,
  LocalizedText,
  Location,
  Media,
  MediaImage,
  Money,
  PageMeta,
  Paginated,
} from "@/types";

import type {
  AdminCoach,
  Certification,
  CoachBooking,
  CoachBookingStatus,
  CoachDraft,
  CoachPackage,
  CoachSessionMode,
  CoachSpecialisation,
  CoachVerificationStatus,
} from "../types";
import type { CoachesAdminService } from "./coaches.contract";
import { coachDraftProblems } from "./coaches.rules";

const enc = encodeURIComponent;
const auth = { auth: true } as const;
const blank: LocalizedText = { en: "", ar: "" };

/* ---- live DTO shapes (docs/api-live/admin.json) ---------------------------- */

interface PagedDto<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages?: number;
  readonly hasNextPage?: boolean;
  readonly hasPreviousPage?: boolean;
  readonly meta?: PageMeta | null;
}

function toPage<T, R>(dto: PagedDto<T>, map: (item: T) => R): Paginated<R> {
  /* `meta` is nullable in the spec; the flat fields carry the same numbers. */
  const meta: PageMeta = dto.meta ?? {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalCount,
    totalPages: dto.totalPages ?? Math.max(1, Math.ceil(dto.totalCount / Math.max(1, dto.pageSize))),
    hasNextPage: dto.hasNextPage ?? false,
    hasPreviousPage: dto.hasPreviousPage ?? false,
  };
  return { items: dto.items.map(map), meta };
}

interface AuditDto {
  readonly createdAt: string;
  readonly createdBy?: number | null;
  readonly updatedAt?: string | null;
  readonly updatedBy?: number | null;
}

function toAuditInfo(dto: AuditDto): AuditInfo {
  return {
    createdAt: dto.createdAt,
    createdBy: dto.createdBy != null ? String(dto.createdBy) : "",
    updatedAt: dto.updatedAt ?? dto.createdAt,
    updatedBy: dto.updatedBy != null ? String(dto.updatedBy) : "",
  };
}

/** Integer minor units on both sides, like every other mapped adapter here. */
interface MoneyDto {
  readonly amount: number;
  readonly currency?: string | null;
}

const toMoney = (dto: MoneyDto): Money => ({ amount: dto.amount, currency: (dto.currency || "JOD") as CurrencyCode });

interface MediaImageDto {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly kind?: string | null;
}

function toMediaImage(dto: MediaImageDto): MediaImage {
  return {
    kind: "image",
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    width: dto.width ?? undefined,
    height: dto.height ?? undefined,
  };
}

const toMedia = (dto: MediaImageDto): Media =>
  dto.kind === "video" ? { kind: "video", id: dto.id, url: dto.url } : toMediaImage(dto);

interface LocationDto {
  readonly id: number;
  readonly slug: string;
  readonly name: LocalizedText;
}

function toLocation(dto: LocationDto): Location {
  /* `LocationDto` has no city or country — left blank rather than guessed. */
  return { id: String(dto.id), name: dto.name, city: blank, countryCode: "" };
}

interface CoachPackageDto {
  readonly id: number;
  readonly name: LocalizedText;
  readonly durationMinutes: number;
  readonly sessionCount: number;
  readonly mode: string;
  readonly price: MoneyDto;
  readonly compareAtPrice: MoneyDto | null;
}

function toPackage(dto: CoachPackageDto): CoachPackage {
  return {
    id: String(dto.id),
    name: dto.name,
    durationMinutes: dto.durationMinutes,
    sessionCount: dto.sessionCount,
    mode: dto.mode as CoachSessionMode,
    price: toMoney(dto.price),
    compareAtPrice: dto.compareAtPrice ? toMoney(dto.compareAtPrice) : undefined,
  };
}

interface CoachCertificationDto {
  readonly id: number;
  readonly name: LocalizedText;
  readonly issuer: LocalizedText;
  readonly year: number | null;
  readonly isVerified: boolean;
}

function toCertification(dto: CoachCertificationDto): Certification {
  return {
    id: String(dto.id),
    name: dto.name,
    issuedBy: dto.issuer,
    year: dto.year ?? undefined,
    isVerified: dto.isVerified,
  };
}

interface AdminCoachDto {
  readonly id: number;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly headline: LocalizedText;
  readonly bio: LocalizedText | null;
  readonly email: string;
  readonly locationId: number;
  readonly sportIds: readonly number[];
  readonly specializations: readonly number[];
  readonly languages: readonly string[];
  readonly yearsOfExperience: number;
  readonly responseTimeHours: number;
  readonly sessionRate: MoneyDto | null;
  readonly packages: readonly CoachPackageDto[];
  readonly certifications: readonly CoachCertificationDto[];
  readonly avatar: MediaImageDto | null;
  readonly gallery: readonly MediaImageDto[];
  readonly verificationStatus: string;
  readonly verificationNote: string | null;
  readonly completedSessions: number;
  /* Whether the coach can sign in; nothing on `AdminCoach` shows it yet. */
  readonly hasLogin: boolean;
  readonly audit: AuditDto;
}

function toCoach(dto: AdminCoachDto, locations: readonly Location[]): AdminCoach {
  const locationId = String(dto.locationId);
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.name,
    email: dto.email,
    headline: dto.headline,
    bio: dto.bio ?? undefined,
    avatar: dto.avatar ? toMediaImage(dto.avatar) : undefined,
    gallery: dto.gallery.map(toMedia),
    sportIds: dto.sportIds.map(String),
    specializations: dto.specializations.map(String),
    certifications: dto.certifications.map(toCertification),
    yearsOfExperience: dto.yearsOfExperience,
    languages: dto.languages,
    /* The DTO carries only the id; the venue itself comes from `/coach-locations`. */
    location: locations.find((location) => location.id === locationId) ?? {
      id: locationId,
      name: blank,
      city: blank,
      countryCode: "",
    },
    /* No live source, on read or on write. */
    isRemoteAvailable: false,
    sessionRate: dto.sessionRate ? toMoney(dto.sessionRate) : undefined,
    packages: dto.packages.map(toPackage),
    completedSessions: dto.completedSessions,
    responseTimeHours: dto.responseTimeHours,
    /* No live source; a zero count is what every screen already prints as "no reviews". */
    rating: { average: 0, count: 0 },
    verificationStatus: dto.verificationStatus as CoachVerificationStatus,
    statusNote: dto.verificationNote ?? undefined,
    audit: toAuditInfo(dto.audit),
  };
}

interface CoachSpecialisationDto {
  readonly id: number;
  readonly name: LocalizedText;
}

/* No coach count on the wire: left absent rather than shown as 0. */
const toSpecialisation = (dto: CoachSpecialisationDto): CoachSpecialisation => ({
  id: String(dto.id),
  name: dto.name,
});

interface CoachBookingDto {
  readonly id: number;
  readonly reference: string;
  readonly coachId: number;
  readonly coachName: string;
  readonly packageId: number;
  readonly packageName: string;
  readonly customerId: number | null;
  readonly contact: { readonly name: string; readonly email: string; readonly phone: string | null };
  readonly goal: string | null;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: string;
  readonly total: MoneyDto;
  readonly note: string | null;
  readonly audit: AuditDto;
}

function toBooking(dto: CoachBookingDto): CoachBooking {
  return {
    id: String(dto.id),
    reference: dto.reference,
    coachId: String(dto.coachId),
    /* Plain strings on the wire, not localized — the same value in both languages. */
    coachName: { en: dto.coachName, ar: dto.coachName },
    packageId: String(dto.packageId),
    packageName: { en: dto.packageName, ar: dto.packageName },
    /* No live source for either. */
    mode: undefined,
    sessionCount: undefined,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    total: toMoney(dto.total),
    customerId: dto.customerId != null ? String(dto.customerId) : "",
    contact: { name: dto.contact.name, email: dto.contact.email, phone: dto.contact.phone ?? "" },
    goal: dto.goal ?? undefined,
    status: dto.status as CoachBookingStatus,
    statusNote: dto.note ?? undefined,
    audit: toAuditInfo(dto.audit),
  };
}

/* ---- the multipart body of POST/PUT /v1/admin/coaches ----------------------- */

/** A calendar date from the form, as the date-time the API binds. */
const toDateTime = (date: string) => `${date}T00:00:00Z`;

/** Only an id the server issued is sent back; a package added on the form has a form-local one. */
const isServerId = (id: string) => /^\d+$/.test(id);

function appendText(form: FormData, key: string, value: LocalizedText): void {
  form.append(`${key}.En`, value.en);
  form.append(`${key}.Ar`, value.ar);
}

function appendMoney(form: FormData, key: string, value: Money): void {
  form.append(`${key}.Amount`, String(value.amount));
  form.append(`${key}.Currency`, value.currency);
}

function appendIfSet(form: FormData, key: string, value: string): void {
  if (value) form.append(key, value);
}

/**
 * ASP.NET Core's form binder reads this body: scalars under dotted keys
 * (`Profile.Name.En`), scalar lists as repeated keys (`Profile.SportIds`),
 * and lists of objects under contiguous indexed keys (`Profile.Packages[0].Price.Amount`,
 * `Certificates[0].CertificateFile` as a file part). An empty list sends no key.
 *
 * Not sent: `User.ProfileImage` wants the raw file in this same request, but
 * the avatar and the gallery are uploaded first through the media service and
 * held as references, and the profile has no field for either — so neither
 * reaches the live API from here. `User.IsActive` is not sent on an edit: the
 * API never returns it, so there is nothing to send back but a guess.
 */
function coachForm(draft: CoachDraft, mode: "create" | "update"): FormData {
  const form = new FormData();
  const isNew = mode === "create";

  appendIfSet(form, "User.UserName", draft.userName.trim());
  if (isNew && draft.password) form.append("User.Password", draft.password);
  appendIfSet(form, "User.PhoneNumber", draft.phoneNumber.trim());
  form.append("User.Email", draft.email.trim());
  form.append("User.FullName", draft.name.en);

  form.append("Profile.Slug", draft.slug.trim());
  appendText(form, "Profile.Name", draft.name);
  appendText(form, "Profile.Headline", draft.headline);
  appendText(form, "Profile.Bio", draft.bio ?? blank);
  form.append("Profile.LocationId", draft.locationId);
  for (const id of draft.sportIds) form.append("Profile.SportIds", id);
  for (const id of draft.specializations) form.append("Profile.Specializations", id);
  for (const language of draft.languages) form.append("Profile.Languages", language);
  form.append("Profile.YearsOfExperience", String(draft.yearsOfExperience));
  form.append("Profile.ResponseTimeHours", String(draft.responseTimeHours));
  if (draft.sessionRate) appendMoney(form, "Profile.SessionRate", draft.sessionRate);
  draft.packages.forEach((pkg, index) => {
    const key = `Profile.Packages[${index}]`;
    if (isServerId(pkg.id)) form.append(`${key}.Id`, pkg.id);
    appendText(form, `${key}.Name`, pkg.name);
    form.append(`${key}.DurationMinutes`, String(pkg.durationMinutes));
    form.append(`${key}.SessionCount`, String(pkg.sessionCount));
    form.append(`${key}.Mode`, pkg.mode);
    appendMoney(form, `${key}.Price`, pkg.price);
    if (pkg.compareAtPrice) appendMoney(form, `${key}.CompareAtPrice`, pkg.compareAtPrice);
  });

  /* Add only. The lists replace what is stored, and the DTO returns none of
     them, so an edit leaves them out rather than overwrite them unseen. */
  if (!isNew) return form;

  draft.educations?.forEach((entry, index) => {
    const key = `Educations[${index}]`;
    form.append(`${key}.SchoolName`, entry.schoolName.trim());
    appendIfSet(form, `${key}.AcademicDegreeId`, entry.academicDegreeId);
    appendIfSet(form, `${key}.UniversityMajorId`, entry.universityMajorId);
    if (entry.startDate) form.append(`${key}.StartDate`, toDateTime(entry.startDate));
    if (entry.endDate && !entry.isStillEducation) form.append(`${key}.EndDate`, toDateTime(entry.endDate));
    form.append(`${key}.IsStillEducation`, String(entry.isStillEducation));
  });
  draft.certificates?.forEach((entry, index) => {
    const key = `Certificates[${index}]`;
    form.append(`${key}.CertificateName`, entry.certificateName.trim());
    form.append(`${key}.OrganizationName`, entry.organizationName.trim());
    form.append(`${key}.CredentialId`, entry.credentialId.trim());
    if (entry.issuedDate) form.append(`${key}.IssuedDate`, toDateTime(entry.issuedDate));
    if (entry.expiryDate) form.append(`${key}.ExpiryDate`, toDateTime(entry.expiryDate));
    appendIfSet(form, `${key}.CredentialUrl`, entry.credentialUrl.trim());
    if (entry.certificateFile) {
      form.append(`${key}.CertificateFile`, entry.certificateFile, entry.certificateFile.name);
    }
  });
  draft.experiences?.forEach((entry, index) => {
    const key = `Experiences[${index}]`;
    form.append(`${key}.Address`, entry.address.trim());
    appendIfSet(form, `${key}.JobTypeId`, entry.jobTypeId);
    form.append(`${key}.CompanyName`, entry.companyName.trim());
    form.append(`${key}.CompanyAddress`, entry.companyAddress.trim());
    if (entry.startDate) form.append(`${key}.StartDate`, toDateTime(entry.startDate));
    if (entry.endDate && !entry.isStillWorking) form.append(`${key}.EndDate`, toDateTime(entry.endDate));
    form.append(`${key}.IsStillWorking`, String(entry.isStillWorking));
  });
  draft.skills?.forEach((entry, index) => {
    const key = `Skills[${index}]`;
    form.append(`${key}.CourseId`, entry.courseId);
    form.append(`${key}.PercentageScore`, String(entry.percentageScore));
  });
  return form;
}

/** The live API reports these against its own multipart paths, so they are caught here first. */
function assertValid(draft: CoachDraft, mode: "create" | "update"): void {
  const problems = coachDraftProblems(draft, mode);
  if (Object.keys(problems).length > 0) throw validationFailed(problems);
}

/* ---- the adapter ------------------------------------------------------------ */

const getLocations = async () =>
  (await httpClient.get<readonly LocationDto[]>("/v1/admin/coach-locations", auth)).map(toLocation);

async function readCoach(request: Promise<AdminCoachDto>): Promise<AdminCoach> {
  const [dto, locations] = await Promise.all([request, getLocations()]);
  return toCoach(dto, locations);
}

/**
 * Coaches, their verification and their sessions over `/v1/admin/coaches`,
 * `/v1/admin/coach-specialisations` and `/v1/admin/coach-bookings`.
 *
 * Every table reads a paged collection; the profile form's specialisation
 * checkboxes read `/coach-specialisations/options`, the whole (bounded) list.
 * A coach's venue arrives as `locationId` alone, so each coach read also reads
 * `/coach-locations` to resolve it.
 */
export const httpCoachesAdminService: CoachesAdminService = {
  listCoaches: async (query = {}) => {
    const [page, locations] = await Promise.all([
      httpClient.get<PagedDto<AdminCoachDto>>("/v1/admin/coaches", {
        query: {
          ...adminListParams(query),
          /* The spec lists both `Statuses` and `VerificationStatuses` and defines
             neither; a coach has no status but its verification, so both get it. */
          statuses: query.statuses,
          verificationStatuses: query.statuses,
          sportIds: query.sportIds,
        },
        ...auth,
      }),
      getLocations(),
    ]);
    return toPage(page, (dto) => toCoach(dto, locations));
  },
  getCoach: async (id) => {
    const [dto, locations] = await Promise.all([
      orNull(httpClient.get<AdminCoachDto>(`/v1/admin/coaches/${enc(id)}`, auth)),
      getLocations(),
    ]);
    return dto ? toCoach(dto, locations) : null;
  },
  createCoach: async (draft) => {
    assertValid(draft, "create");
    await httpClient.post<unknown>("/v1/admin/coaches", coachForm(draft, "create"), auth);
    /* Create answers the new login (`UserDto`), whose `userId` is not the coach id: the profile is found by its unique slug. */
    const slug = draft.slug.trim();
    const [page, locations] = await Promise.all([
      httpClient.get<PagedDto<AdminCoachDto>>("/v1/admin/coaches", { query: { search: slug, pageSize: 100 }, ...auth }),
      getLocations(),
    ]);
    const dto = page.items.find((item) => item.slug === slug);
    if (!dto) throw new AppError("not-found", `The coach was added, but no profile at "${slug}" came back.`);
    return toCoach(dto, locations);
  },
  updateCoach: async (id, draft) => {
    assertValid(draft, "update");
    return readCoach(httpClient.put<AdminCoachDto>(`/v1/admin/coaches/${enc(id)}`, coachForm(draft, "update"), auth));
  },
  deleteCoach: async (id) => {
    await httpClient.delete<void>(`/v1/admin/coaches/${enc(id)}`, auth);
  },
  decideVerification: ({ coachId, status, note }) =>
    readCoach(
      httpClient.put<AdminCoachDto>(
        `/v1/admin/coaches/${enc(coachId)}/verification`,
        { status, note: note ?? null },
        auth,
      ),
    ),
  setCertificationVerified: (coachId, certificationId, isVerified) =>
    readCoach(
      httpClient.put<AdminCoachDto>(
        `/v1/admin/coaches/${enc(coachId)}/certifications/${enc(certificationId)}`,
        { isVerified },
        auth,
      ),
    ),
  listLocations: getLocations,
  listSpecialisations: async () =>
    (
      await httpClient.get<readonly CoachSpecialisationDto[]>("/v1/admin/coach-specialisations/options", auth)
    ).map(toSpecialisation),
  listSpecialisationsPage: async (query) =>
    toPage(
      await httpClient.get<PagedDto<CoachSpecialisationDto>>("/v1/admin/coach-specialisations", {
        query: adminListParams(query),
        ...auth,
      }),
      toSpecialisation,
    ),
  createSpecialisation: async (draft) =>
    toSpecialisation(
      await httpClient.post<CoachSpecialisationDto>(
        "/v1/admin/coach-specialisations",
        { name: { en: draft.name.en, ar: draft.name.ar } },
        auth,
      ),
    ),
  updateSpecialisation: async (id, draft) =>
    toSpecialisation(
      await httpClient.put<CoachSpecialisationDto>(
        `/v1/admin/coach-specialisations/${enc(id)}`,
        { name: { en: draft.name.en, ar: draft.name.ar } },
        auth,
      ),
    ),
  deleteSpecialisation: async (id) => {
    await httpClient.delete<void>(`/v1/admin/coach-specialisations/${enc(id)}`, auth);
  },
  listBookings: async (query = {}) =>
    toPage(
      await httpClient.get<PagedDto<CoachBookingDto>>("/v1/admin/coach-bookings", {
        query: {
          ...adminListParams(query),
          statuses: query.statuses,
          /* The live filter is `CoachIds` (plural, array); there is no singular `coachId`. */
          coachIds: query.coachId ? [query.coachId] : undefined,
          customerId: query.customerId,
          upcomingOnly: query.upcomingOnly,
        },
        ...auth,
      }),
      toBooking,
    ),
  getBooking: async (id) => {
    const dto = await orNull(httpClient.get<CoachBookingDto>(`/v1/admin/coach-bookings/${enc(id)}`, auth));
    return dto ? toBooking(dto) : null;
  },
  setBookingStatus: async (id, status, note) =>
    toBooking(
      await httpClient.put<CoachBookingDto>(
        `/v1/admin/coach-bookings/${enc(id)}/status`,
        { status, note: note ?? null },
        auth,
      ),
    ),
};
