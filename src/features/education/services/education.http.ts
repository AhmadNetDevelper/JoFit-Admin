import { adminListParams, httpClient, orNull } from "@/services";
import type { AuditInfo, CurrencyCode, LocalizedText, MediaImage, Money, Paginated, PublishStatus } from "@/types";

import type {
  AdminCourse,
  CourseCategory,
  CourseDraft,
  CourseFormat,
  CourseIntakeState,
  CourseLevel,
  Enrolment,
  EnrolmentStatus,
} from "../types";
import type { EducationAdminService } from "./education.contract";

const enc = encodeURIComponent;

/* ------------------------------------------------------------------------
 * Wire DTOs — `docs/api-live/admin.json`, tags AdminCourseCatalogue (not the
 * unrelated generic `Course` CRUD tag — confirmed, every path below is
 * `/v1/admin/courses...`), AdminCourseCategories and AdminEnrolments.
 * Ids are `int64`; `audit` is nested; several admin fields (`sportIds`,
 * `rating`, `courseCount`, `customerEmail`, `audit` on an enrolment) simply
 * have no live source at all. The `to*`/`from*` functions below are this
 * adapter's mapping layer, the way the `.mock.ts` sibling's `to*` helpers
 * reshape fixture data — just against the real wire shape.
 * ------------------------------------------------------------------------ */

interface AuditDto {
  readonly createdAt: string;
  readonly createdBy: number | null;
  readonly updatedAt: string | null;
  readonly updatedBy: number | null;
}

interface MediaImageDto {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
}

interface MoneyDto {
  readonly amount: number;
  readonly currency?: string;
}

interface CertificationDto {
  readonly name: LocalizedText;
  readonly issuedBy: LocalizedText;
}

interface NextIntakeDto {
  readonly startsOn: string;
  readonly seatsTotal: number;
  readonly seatsTaken: number;
}

interface PagedResultDto<TDto> {
  readonly items: readonly TDto[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly totalPages: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

interface AdminCourseDto {
  readonly id: number;
  readonly slug: string | null;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText | null;
  readonly status: string;
  readonly format: string;
  readonly level: string;
  readonly durationHours: number;
  readonly moduleCount: number;
  readonly price: MoneyDto;
  readonly compareAtPrice: MoneyDto | null;
  readonly categoryIds: readonly number[];
  readonly instructorIds: readonly number[];
  readonly languages: readonly string[];
  readonly venue: LocalizedText | null;
  readonly certification: CertificationDto | null;
  readonly nextIntake: NextIntakeDto | null;
  readonly media: readonly MediaImageDto[];
  readonly enrolmentCount: number;
  readonly publishedAt: string | null;
  readonly audit: AuditDto;
}

interface CourseCategoryDto {
  readonly id: number;
  readonly slug: string | null;
  readonly name: LocalizedText;
  readonly description: LocalizedText | null;
}

interface AdminEnrolmentDto {
  readonly id: number;
  readonly reference: string;
  readonly courseId: number;
  readonly courseTitle: LocalizedText;
  readonly customerId: number;
  readonly customerName: string | null;
  readonly status: string;
  readonly nextStatuses: readonly string[];
  readonly cohortStartsOn: string | null;
  readonly amountPaid: MoneyDto;
  readonly progressPercent: number;
  readonly note: string | null;
  readonly enrolledAt: string;
}

function toAudit(dto: AuditDto): AuditInfo {
  return {
    createdAt: dto.createdAt,
    createdBy: dto.createdBy != null ? String(dto.createdBy) : "",
    // `updatedAt` is nullable live (never touched since creation) — fall back to `createdAt`.
    updatedAt: dto.updatedAt ?? dto.createdAt,
    updatedBy: dto.updatedBy != null ? String(dto.updatedBy) : "",
  };
}

function toMediaImage(dto: MediaImageDto): MediaImage {
  return {
    kind: "image",
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    ...(dto.width != null ? { width: dto.width } : {}),
    ...(dto.height != null ? { height: dto.height } : {}),
  };
}

function toMoney(dto: MoneyDto): Money {
  return { amount: dto.amount, currency: (dto.currency ?? "JOD") as CurrencyCode };
}

function toPaginated<TDto, TDomain>(page: PagedResultDto<TDto>, mapItem: (item: TDto) => TDomain): Paginated<TDomain> {
  return {
    items: page.items.map(mapItem),
    meta: {
      page: page.page,
      pageSize: page.pageSize,
      totalItems: page.totalCount,
      totalPages: page.totalPages,
      hasNextPage: page.hasNextPage,
      hasPreviousPage: page.hasPreviousPage,
    },
  };
}

const MS_PER_DAY = 86_400_000;

/**
 * The live API sends raw seat counts only, never the derived intake state —
 * this mirrors the same rule `education.mock.ts`'s own `intakeState` applies
 * to its fixtures, so a course reads the same way from either backend: full
 * with no seat left, "upcoming" more than seven weeks out, "closing" with
 * three or fewer seats, otherwise open.
 */
function intakeState(startsOn: string, seatsTotal: number, seatsTaken: number): CourseIntakeState {
  const remaining = seatsTotal - seatsTaken;
  if (remaining <= 0) return "full";
  const daysAhead = Math.round((Date.parse(startsOn) - Date.now()) / MS_PER_DAY);
  if (Number.isFinite(daysAhead) && daysAhead > 49) return "upcoming";
  if (remaining <= 3) return "closing";
  return "open";
}

function toAdminCourse(dto: AdminCourseDto): AdminCourse {
  // `nextIntake` is itself nullable live (a course with no cohort scheduled yet) — degrade to an empty one.
  const intake = dto.nextIntake ?? { startsOn: "", seatsTotal: 0, seatsTaken: 0 };
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    title: dto.title,
    summary: dto.summary,
    ...(dto.description ? { description: dto.description } : {}),
    media: dto.media.map(toMediaImage),
    format: dto.format as CourseFormat,
    level: dto.level as CourseLevel,
    durationHours: dto.durationHours,
    price: toMoney(dto.price),
    ...(dto.compareAtPrice ? { compareAtPrice: toMoney(dto.compareAtPrice) } : {}),
    categoryIds: dto.categoryIds.map(String),
    // Live has no `sportIds` on this DTO at all — nothing to read (or write) yet.
    instructorIds: dto.instructorIds.map(String),
    moduleCount: dto.moduleCount,
    ...(dto.certification ? { certification: dto.certification } : {}),
    languages: dto.languages,
    ...(dto.venue ? { venue: dto.venue } : {}),
    nextIntake: {
      startsOn: intake.startsOn,
      seatsTotal: intake.seatsTotal,
      seatsTaken: intake.seatsTaken,
      state: intakeState(intake.startsOn, intake.seatsTotal, intake.seatsTaken),
    },
    enrolmentCount: dto.enrolmentCount,
    // Live has no `rating` on the course DTO at all — nothing to read yet.
    status: dto.status as PublishStatus,
    ...(dto.publishedAt ? { publishedAt: dto.publishedAt } : {}),
    audit: toAudit(dto.audit),
  };
}

function toCourseCategory(dto: CourseCategoryDto): CourseCategory {
  return {
    id: String(dto.id),
    slug: dto.slug ?? "",
    name: dto.name,
    ...(dto.description ? { description: dto.description } : {}),
    // Live has no `courseCount` on this DTO at all — 0 until the backend adds it.
    courseCount: 0,
  };
}

function toEnrolment(dto: AdminEnrolmentDto): Enrolment {
  return {
    id: String(dto.id),
    reference: dto.reference,
    courseId: String(dto.courseId),
    courseTitle: dto.courseTitle,
    customerId: String(dto.customerId),
    customerName: dto.customerName ?? "",
    // Live has no `customerEmail` on this DTO at all — nothing to read yet.
    cohortStartsOn: dto.cohortStartsOn ?? "",
    status: dto.status as EnrolmentStatus,
    nextStatuses: dto.nextStatuses,
    progressPercent: dto.progressPercent,
    enrolledAt: dto.enrolledAt,
    amountPaid: toMoney(dto.amountPaid),
    // Live calls this `note`; the admin type calls it `statusNote`.
    ...(dto.note ? { statusNote: dto.note } : {}),
    // Live has no `audit` on this DTO at all — nothing to read yet.
  };
}

/** `CourseDraft`'s ids are strings; the live `CourseDraftRequest` wants `int64`. */
function fromCourseDraft(draft: CourseDraft) {
  return {
    slug: draft.slug,
    title: draft.title,
    summary: draft.summary,
    format: draft.format,
    level: draft.level,
    durationHours: draft.durationHours,
    moduleCount: draft.moduleCount,
    price: draft.price,
    ...(draft.compareAtPrice ? { compareAtPrice: draft.compareAtPrice } : {}),
    categoryIds: draft.categoryIds.map(Number),
    // Live request has no `sportIds` field at all — nothing to send.
    instructorIds: draft.instructorIds.map(Number),
    languages: draft.languages,
    ...(draft.venue ? { venue: draft.venue } : {}),
    ...(draft.certification ? { certification: draft.certification } : {}),
    nextIntake: draft.nextIntake,
    media: draft.media,
    // No `description` field on the editor yet — nothing to send.
  };
}

/**
 * The academy over `/v1/admin/courses`, `/v1/admin/course-categories` and
 * `/v1/admin/enrolments`. Seat counts and category totals are computed by the API.
 *
 * Every table reads a paged collection; the course form's category checkboxes
 * read `/course-categories/options`, the whole (bounded) list.
 */
export const httpEducationAdminService: EducationAdminService = {
  listCourses: (query = {}) =>
    httpClient
      .get<PagedResultDto<AdminCourseDto>>("/v1/admin/courses", {
        query: {
          ...adminListParams(query),
          statuses: query.statuses,
          categoryIds: query.categoryIds,
          // `GetAdminCourses` has no instructor filter under any name — a real capability gap, not a
          // misnamed param, so it is dropped here rather than sent as a no-op.
        },
        auth: true,
      })
      .then((page) => toPaginated(page, toAdminCourse)),
  getCourse: async (id) => {
    const dto = await orNull(httpClient.get<AdminCourseDto>(`/v1/admin/courses/${enc(id)}`, { auth: true }));
    return dto ? toAdminCourse(dto) : null;
  },
  createCourse: async (draft) =>
    toAdminCourse(await httpClient.post<AdminCourseDto>("/v1/admin/courses", fromCourseDraft(draft), { auth: true })),
  updateCourse: async (id, draft) =>
    toAdminCourse(
      await httpClient.put<AdminCourseDto>(`/v1/admin/courses/${enc(id)}`, fromCourseDraft(draft), { auth: true }),
    ),
  deleteCourse: async (id) => {
    await httpClient.delete<void>(`/v1/admin/courses/${enc(id)}`, { auth: true });
  },
  setCourseStatus: async (id, status) =>
    toAdminCourse(
      await httpClient.put<AdminCourseDto>(`/v1/admin/courses/${enc(id)}/status`, { status }, { auth: true }),
    ),
  listCategories: async () => {
    const dtos = await httpClient.get<CourseCategoryDto[]>("/v1/admin/course-categories/options", { auth: true });
    return dtos.map(toCourseCategory);
  },
  listCategoriesPage: (query) =>
    httpClient
      .get<PagedResultDto<CourseCategoryDto>>("/v1/admin/course-categories", {
        query: adminListParams(query),
        auth: true,
      })
      .then((page) => toPaginated(page, toCourseCategory)),
  createCategory: async (draft) =>
    toCourseCategory(
      await httpClient.post<CourseCategoryDto>("/v1/admin/course-categories", draft, { auth: true }),
    ),
  updateCategory: async (id, draft) =>
    toCourseCategory(
      await httpClient.put<CourseCategoryDto>(`/v1/admin/course-categories/${enc(id)}`, draft, { auth: true }),
    ),
  deleteCategory: async (id) => {
    await httpClient.delete<void>(`/v1/admin/course-categories/${enc(id)}`, { auth: true });
  },
  listEnrolments: (query = {}) =>
    httpClient
      .get<PagedResultDto<AdminEnrolmentDto>>("/v1/admin/enrolments", {
        query: {
          ...adminListParams(query),
          statuses: query.statuses,
          courseId: query.courseId,
          customerId: query.customerId,
          // `GetAdminEnrolments` has no `cohortStartsOn`/`excludeCohortStartsOn` filter under any name — its
          // real params (`ModerationStatuses`/`TargetTypes`/`MinRating`/`AssigneeIds`/`UnassignedOnly`) look
          // like they leaked from a shared review-moderation base class rather than being real enrolment
          // filters, so they're left unwired rather than sent as noise.
        },
        auth: true,
      })
      .then((page) => toPaginated(page, toEnrolment)),
  setEnrolmentStatus: async (id, status, note) =>
    toEnrolment(
      await httpClient.put<AdminEnrolmentDto>(`/v1/admin/enrolments/${enc(id)}/status`, { status, note }, { auth: true }),
    ),
};
