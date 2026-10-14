import type { SportId } from "@/features/sports";
import type {
  AuditInfo,
  ListQuery,
  LocalizedText,
  Media,
  Money,
  PublishStatus,
  RatingSummary,
} from "@/types";

/**
 * Course catalogue and enrolments.
 *
 * Still not an LMS: lessons, progress tracking and assessment delivery are out
 * of scope. What the admin does hold is the enrolment RECORD — who has a place
 * on which cohort, whether they have paid, and whether they finished — because
 * the storefront's intake signal ("open", "closing", "full") is computed from
 * exactly those records, and staff are the ones who confirm, cancel and close
 * them.
 *
 * OPEN BUSINESS DECISIONS: who may enrol, refunds, and what a certification
 * requires.
 */
export const COURSE_FORMATS = ["online", "in-person", "hybrid", "self-paced"] as const;
export type CourseFormat = (typeof COURSE_FORMATS)[number];
export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

/** The storefront's four intake states, derived — never stored. */
export type CourseIntakeState = "open" | "closing" | "full" | "upcoming";

export interface CourseIntake {
  /** `YYYY-MM-DD`. */
  readonly startsOn: string;
  readonly seatsTotal: number;
  /** Pending and active enrolments on this cohort — counted, not typed. */
  readonly seatsTaken: number;
  readonly state: CourseIntakeState;
}

export interface CourseCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
  /**
   * Courses filed under it, counted on every read — one in use cannot be
   * deleted. Optional: the live `CourseCategoryDto` has no such field at all,
   * so the HTTP adapter reports 0 until the backend adds it.
   */
  readonly courseCount?: number;
}

/** The editable part of a course category. A blank description is stored as none. */
export type CourseCategoryDraft = Omit<CourseCategory, "id" | "courseCount">;

/** What the categories table can be sorted by; it opens sorted by name. */
export const COURSE_CATEGORY_SORT_FIELDS = ["name", "slug", "courseCount"] as const;
export type CourseCategorySortField = (typeof COURSE_CATEGORY_SORT_FIELDS)[number];

export interface CourseCertification {
  readonly name: LocalizedText;
  readonly issuedBy: LocalizedText;
}

export interface AdminCourse {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  /** Live-only today (`AdminCourseDto.description`) — `AdminCourse` has no editor field for it yet, only `summary`. */
  readonly description?: LocalizedText;
  /**
   * The course's pictures, in display order — the first is the one on its card
   * and at the top of its page. At most 12. Empty, the storefront draws the
   * course's glyph instead.
   */
  readonly media: readonly Media[];
  readonly format: CourseFormat;
  readonly level: CourseLevel;
  readonly durationHours: number;
  readonly price: Money;
  readonly compareAtPrice?: Money;
  readonly categoryIds: readonly string[];
  /** The live `AdminCourseDto`/`CourseDraftRequest` have no `sportIds` field at all — nothing to read or write yet. */
  readonly sportIds?: readonly SportId[];
  /** Coach ids — courses are taught by the people the coaches domain verifies. */
  readonly instructorIds: readonly string[];
  readonly moduleCount: number;
  readonly certification?: CourseCertification;
  /** BCP-47 codes of the languages of delivery. */
  readonly languages: readonly string[];
  /** Absent for an online course. */
  readonly venue?: LocalizedText;
  readonly nextIntake: CourseIntake;
  /** Every enrolment that was not cancelled, across all cohorts. */
  readonly enrolmentCount: number;
  /** The live course DTO has no `rating` field at all — nothing to read yet. */
  readonly rating?: RatingSummary;
  readonly status: PublishStatus;
  /** When the course was last published, as the live API tracks it. Unset for a course never published. */
  readonly publishedAt?: string;
  readonly audit: AuditInfo;
}

/**
 * What staff type when they add or edit a course.
 *
 * Status is not in it — publishing has its own action and its own rule (every
 * language first) — and neither is anything counted: seats taken, the intake
 * signal, enrolments and ratings all come from records. Of the next intake,
 * only the date and the seat total are typed.
 *
 * The price is whatever staff enter. There is no default: the client has not
 * yet confirmed prices for the NCSF courses, and a made-up figure on a course
 * page is one a customer would act on.
 */
export interface CourseDraft
  extends Pick<
    AdminCourse,
    | "slug"
    | "title"
    | "summary"
    | "media"
    | "format"
    | "level"
    | "durationHours"
    | "price"
    | "compareAtPrice"
    | "categoryIds"
    | "sportIds"
    | "instructorIds"
    | "moduleCount"
    | "certification"
    | "languages"
    | "venue"
  > {
  readonly nextIntake: Pick<CourseIntake, "startsOn" | "seatsTotal">;
}

export const COURSE_SORT_FIELDS = ["title", "status", "enrolmentCount", "updatedAt"] as const;
export type CourseSortField = (typeof COURSE_SORT_FIELDS)[number];

export interface CourseListQuery extends ListQuery<CourseSortField> {
  readonly statuses?: readonly PublishStatus[];
  readonly categoryIds?: readonly string[];
  readonly instructorId?: string;
}

/* ----------------------------------------------------------- enrolments */

/** The storefront's own vocabulary for an enrolment. */
export const ENROLMENT_STATUSES = ["pending", "active", "completed", "cancelled"] as const;
export type EnrolmentStatus = (typeof ENROLMENT_STATUSES)[number];

/**
 * `pending` holds a seat until payment clears; `active` is paid and attending.
 * Refund and transfer rules around cancellation are OPEN BUSINESS DECISIONS.
 */
export const ENROLMENT_TRANSITIONS: Readonly<Record<EnrolmentStatus, readonly EnrolmentStatus[]>> = {
  pending: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function allowedEnrolmentTransitions(status: EnrolmentStatus): readonly EnrolmentStatus[] {
  return ENROLMENT_TRANSITIONS[status];
}

export interface Enrolment {
  readonly id: string;
  readonly reference: string;
  readonly courseId: string;
  /** Denormalised for the list. */
  readonly courseTitle: LocalizedText;
  /** Into the customer registry. */
  readonly customerId: string;
  readonly customerName: string;
  /** The live `AdminEnrolmentDto` has no `customerEmail` field at all — nothing to read yet. */
  readonly customerEmail?: string;
  /** Which cohort the seat is on. */
  readonly cohortStartsOn: string;
  readonly status: EnrolmentStatus;
  /** Allowed next statuses, as the live API computes them — not wired into `ENROLMENT_TRANSITIONS` yet. */
  readonly nextStatuses?: readonly string[];
  /** Reported by the delivery side; the admin does not track lessons. */
  readonly progressPercent: number;
  readonly enrolledAt: string;
  readonly amountPaid: Money;
  /** Required when an enrolment is cancelled. Live calls this `note`. */
  readonly statusNote?: string;
  /** The live `AdminEnrolmentDto` has no `audit` field at all — nothing to read yet. */
  readonly audit?: AuditInfo;
}

export const ENROLMENT_SORT_FIELDS = ["reference", "enrolledAt", "cohortStartsOn", "status"] as const;
export type EnrolmentSortField = (typeof ENROLMENT_SORT_FIELDS)[number];

export interface EnrolmentListQuery extends ListQuery<EnrolmentSortField> {
  readonly statuses?: readonly EnrolmentStatus[];
  readonly courseId?: string;
  readonly customerId?: string;
  /** `YYYY-MM-DD`: only places on the cohort starting that day — a course's next intake. */
  readonly cohortStartsOn?: string;
  /** `YYYY-MM-DD`: every cohort but the one starting that day — a course's other cohorts. */
  readonly excludeCohortStartsOn?: string;
}
