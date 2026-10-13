import type { SportId } from "@/features/sports";
import type {
  AuditInfo,
  ListQuery,
  LocalizedText,
  Location,
  Media,
  MediaImage,
  Money,
  RatingSummary,
} from "@/types";

/**
 * The admin's main job for coaches is *verification*: coaches write their own
 * profiles, and staff decide whether the profile may be listed. Staff can also
 * add a coach themselves (someone who applied by phone) and correct a profile,
 * but adding is not approving — a coach staff create starts `pending` like any
 * applicant, and only the verification decision lists them.
 *
 * Only an `approved` coach appears on the storefront. The ten coaches the site
 * lists are approved here; the ones still `pending` are applicants the public
 * has never seen — which is the point of a verification queue.
 */
export const COACH_VERIFICATION_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;
export type CoachVerificationStatus = (typeof COACH_VERIFICATION_STATUSES)[number];

export interface Certification {
  readonly id: string;
  /** As the coach wrote it; either language may be blank. */
  readonly name: LocalizedText;
  readonly issuedBy: LocalizedText;
  /** The year it was awarded, when the coach gave one. */
  readonly year?: number;
  /** Staff confirm the document behind the claim. */
  readonly isVerified: boolean;
}

/**
 * A specialisation, by id. The storefront filters and links by the id and prints
 * the name in the reader's language; free text here once meant `/ar/coaches`
 * showed English labels beside Arabic prose.
 */
export interface CoachSpecialisation {
  readonly id: string;
  readonly name: LocalizedText;
  /**
   * Coaches who list it, counted on every read — one still listed cannot be
   * deleted. Absent when the source does not count them (the live API).
   */
  readonly coachCount?: number;
}

/** The editable part of a specialisation. */
export type CoachSpecialisationDraft = Pick<CoachSpecialisation, "name">;

/** What the specialisations table can be sorted by; it opens sorted by name. */
export const COACH_SPECIALISATION_SORT_FIELDS = ["name", "coachCount"] as const;
export type CoachSpecialisationSortField = (typeof COACH_SPECIALISATION_SORT_FIELDS)[number];

export const COACH_SESSION_MODES = ["in-person", "online"] as const;
export type CoachSessionMode = (typeof COACH_SESSION_MODES)[number];

/**
 * What a customer actually buys from a coach — the storefront's booking step
 * sells a package *and* a slot, and the package carries the price. A block of
 * eight is one package, not eight bookings.
 */
export interface CoachPackage {
  readonly id: string;
  readonly name: LocalizedText;
  readonly durationMinutes: number;
  readonly sessionCount: number;
  readonly mode: CoachSessionMode;
  readonly price: Money;
  /** Reference price struck through beside a discounted block. */
  readonly compareAtPrice?: Money;
}

export interface AdminCoach {
  readonly id: string;
  readonly slug: string;
  /** Coach-authored in both languages, as the storefront prints it. */
  readonly name: LocalizedText;
  readonly email: string;
  readonly headline: LocalizedText;
  /** A short introduction, at most 200 characters per language. Optional. */
  readonly bio?: LocalizedText;
  /**
   * The photo on the coach's card (cropped 3:2) and at the top of their profile
   * (4:3). Optional: without one the storefront shows a plain panel.
   */
  readonly avatar?: MediaImage;
  /** Session and venue photos, in display order — the first is the cover. At most 12. */
  readonly gallery: readonly Media[];
  readonly sportIds: readonly SportId[];
  /** Ids into `CoachSpecialisation`. */
  readonly specializations: readonly string[];
  readonly certifications: readonly Certification[];
  readonly yearsOfExperience: number;
  /** BCP-47 codes of the languages the coach works in. */
  readonly languages: readonly string[];
  readonly location: Location;
  readonly isRemoteAvailable: boolean;
  readonly sessionRate?: Money;
  readonly packages: readonly CoachPackage[];
  /** Sessions delivered through the platform. */
  readonly completedSessions: number;
  /** Typical hours to answer a booking request — shown publicly as a promise. */
  readonly responseTimeHours: number;
  readonly rating: RatingSummary;
  readonly verificationStatus: CoachVerificationStatus;
  /** Recorded when a coach is rejected or suspended, for the audit trail. */
  readonly statusNote?: string;
  readonly audit: AuditInfo;
}

/**
 * The profile staff can edit, and fill in when they add a coach.
 *
 * Verification, certifications, ratings and session counts are not in it: each
 * is its own decision or is earned on the platform, so saving a profile can
 * never approve a coach or wipe their record. The venue travels as an id into
 * `listLocations()`, so a typo cannot invent a branch.
 *
 * A coach is also a login. The API never returns the user name or the phone
 * number, so on an edit both start blank and blank keeps what is stored. The
 * password and the four background lists are sent only when adding a coach:
 * the API does not return the background lists either, so an edit could only
 * overwrite them blind.
 */
export interface CoachDraft
  extends Pick<
    AdminCoach,
    | "slug"
    | "name"
    | "email"
    | "headline"
    | "bio"
    | "avatar"
    | "gallery"
    | "sportIds"
    | "specializations"
    | "yearsOfExperience"
    | "languages"
    | "isRemoteAvailable"
    | "sessionRate"
    | "packages"
    | "responseTimeHours"
  > {
  readonly locationId: string;
  /** Sign-in name, 3–256 characters. Required when adding a coach. */
  readonly userName: string;
  /** At least 6 characters when adding a coach; optional either way. */
  readonly phoneNumber: string;
  /** Add only: a temporary password staff hand to the coach, 6–256 characters. */
  readonly password?: string;
  readonly educations?: readonly CoachEducationDraft[];
  readonly certificates?: readonly CoachCertificateDraft[];
  readonly experiences?: readonly CoachExperienceDraft[];
  readonly skills?: readonly CoachSkillDraft[];
}

/*
 * The coach's background, collected once when staff add them. Ids are into the
 * reference tables (`lookupsService`); "" means none chosen. Dates are
 * calendar dates (`YYYY-MM-DD`) or "". Each entry's `id` is the form's own list
 * key and is never sent.
 */

export interface CoachEducationDraft {
  readonly id: string;
  readonly schoolName: string;
  readonly academicDegreeId: string;
  readonly universityMajorId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isStillEducation: boolean;
}

export interface CoachCertificateDraft {
  readonly id: string;
  readonly certificateName: string;
  readonly organizationName: string;
  readonly credentialId: string;
  readonly issuedDate: string;
  readonly expiryDate: string;
  readonly credentialUrl: string;
  /** The scanned certificate, uploaded with the form itself. */
  readonly certificateFile?: File;
}

export interface CoachExperienceDraft {
  readonly id: string;
  readonly address: string;
  readonly companyName: string;
  readonly companyAddress: string;
  readonly jobTypeId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly isStillWorking: boolean;
}

export interface CoachSkillDraft {
  readonly id: string;
  /** Into the `course` reference table. */
  readonly courseId: string;
  /** A whole number 0–100; NaN while blank. */
  readonly percentageScore: number;
}

export const COACH_SORT_FIELDS = ["name", "verificationStatus", "rating", "updatedAt"] as const;
export type CoachSortField = (typeof COACH_SORT_FIELDS)[number];

export interface CoachListQuery extends ListQuery<CoachSortField> {
  readonly statuses?: readonly CoachVerificationStatus[];
  readonly sportIds?: readonly SportId[];
}

export interface CoachStatusDecision {
  readonly coachId: string;
  readonly status: CoachVerificationStatus;
  /** Required when rejecting or suspending — staff must say why. */
  readonly note?: string;
}

/* ------------------------------------------------------------ bookings */

/** The storefront's own four states, so a booking reads the same on both sides. */
export const COACH_BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
export type CoachBookingStatus = (typeof COACH_BOOKING_STATUSES)[number];

/**
 * Structural graph only. Cancellation windows, no-show handling and the coach's
 * commission are OPEN BUSINESS DECISIONS and are not encoded here.
 */
export const COACH_BOOKING_TRANSITIONS: Readonly<
  Record<CoachBookingStatus, readonly CoachBookingStatus[]>
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function allowedCoachBookingTransitions(
  status: CoachBookingStatus,
): readonly CoachBookingStatus[] {
  return COACH_BOOKING_TRANSITIONS[status];
}

/**
 * Who the session is for. Collected at booking, because coaching is bought for a
 * child or a team as often as for oneself — so it can differ from the customer
 * who paid.
 */
export interface CoachBookingContact {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
}

export interface CoachBooking {
  readonly id: string;
  readonly reference: string;
  readonly coachId: string;
  /** Denormalised so the queue reads without loading every coach. */
  readonly coachName: LocalizedText;
  readonly packageId: string;
  readonly packageName: LocalizedText;
  /** Absent when the source does not carry it (the live API). */
  readonly mode?: CoachSessionMode;
  /** Absent when the source does not carry it (the live API). */
  readonly sessionCount?: number;
  /** The first (or only) session. A block schedules the rest with the coach. */
  readonly startsAt: string;
  readonly endsAt: string;
  readonly total: Money;
  /** The account that paid — into the customer registry. */
  readonly customerId: string;
  readonly contact: CoachBookingContact;
  /** What the athlete wants out of it, in their own words. Never translated. */
  readonly goal?: string;
  readonly status: CoachBookingStatus;
  /** Required when a booking is cancelled, like a coach rejection. */
  readonly statusNote?: string;
  readonly audit: AuditInfo;
}

export const COACH_BOOKING_SORT_FIELDS = ["reference", "startsAt", "status", "total"] as const;
export type CoachBookingSortField = (typeof COACH_BOOKING_SORT_FIELDS)[number];

export interface CoachBookingListQuery extends ListQuery<CoachBookingSortField> {
  readonly statuses?: readonly CoachBookingStatus[];
  readonly coachId?: string;
  readonly customerId?: string;
  /** Only sessions starting today or later. */
  readonly upcomingOnly?: boolean;
}
