import type { ListQuery, LocalizedText, MediaImage, Money } from "@/types";

/**
 * CAREERS — the admin side of JoFit's job marketplace for Jordan's sports
 * industry.
 *
 * Gyms, clubs, academies, clinics and sports companies open an EMPLOYER
 * account on the storefront, post jobs and hire from the applications they
 * receive. JoFit staff do three things here, and only these:
 *
 *   1. VERIFY EMPLOYERS. A job from an employer that is not verified is never
 *      public, whatever its own status.
 *   2. REVIEW EVERY JOB before it goes up: approve it, send it back with a note,
 *      close it, feature it, or delete one nobody applied for.
 *   3. OVERSEE APPLICATIONS, read-only. Moving an application is the
 *      employer's decision; staff read it and open the CV.
 *
 * Plus the job categories every job is filed under.
 *
 * What the employer and the candidate wrote (a job title, a description, a
 * cover letter, a company's "about") is stored as written, in whichever
 * language they wrote it, and rendered with `dir="auto"`. What is chosen from
 * a list (category, city, contract type) is an id, shown in the reader's
 * language.
 *
 * The graphs below are the storefront's (`website/src/features/careers/rules.ts`)
 * — one lifecycle, read by both apps and enforced again by the API.
 */

/* ---------------------------------------------------------------- taxonomy */

export const EMPLOYER_KINDS = ["gym", "sports-centre", "club", "academy", "clinic", "sports-company", "other"] as const;
export type EmployerKind = (typeof EMPLOYER_KINDS)[number];

export const EMPLOYER_SIZES = ["1-10", "11-50", "51-200", "200+"] as const;
export type EmployerSize = (typeof EMPLOYER_SIZES)[number];

export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "freelance", "internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ["on-site", "hybrid", "remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EXPERIENCE_LEVELS = ["entry", "mid", "senior"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

/** The main city of each governorate. Labels live in the dictionary (`careers.city.<id>`). */
export const JOB_CITIES = [
  "amman",
  "irbid",
  "zarqa",
  "aqaba",
  "salt",
  "madaba",
  "jerash",
  "ajloun",
  "karak",
  "mafraq",
  "maan",
  "tafilah",
] as const;
export type JobCity = (typeof JOB_CITIES)[number];

export const JOB_LANGUAGES = ["ar", "en"] as const;
export type JobLanguage = (typeof JOB_LANGUAGES)[number];

export const SALARY_PERIODS = ["month", "hour"] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

export interface SalaryRange {
  readonly min?: Money;
  readonly max?: Money;
  readonly period: SalaryPeriod;
}

/* ------------------------------------------------------------- lifecycles */

/**
 * A job's life:
 *   draft → pending                 the employer submits it for review
 *   pending → open | rejected       JoFit staff decide (a rejection carries a note)
 *   pending → draft                 the employer takes it back
 *   open → closed                   the employer or staff close it (or it fills)
 *   closed → pending                the employer reopens it — reviewed again
 *   rejected → pending | draft      the employer fixes it
 * Saving changes to an OPEN job sends it back to `pending`.
 */
export const JOB_STATUSES = ["draft", "pending", "open", "closed", "rejected"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Every move a job can make, whoever makes it. */
export const JOB_TRANSITIONS: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  draft: ["pending"],
  pending: ["open", "rejected", "draft"],
  open: ["closed", "pending"],
  closed: ["pending"],
  rejected: ["pending", "draft"],
};

/**
 * The moves JoFit STAFF make: approve (pending → open, only for a verified
 * employer) or reject (pending → rejected, with a note), and close an open job.
 */
export const STAFF_JOB_MOVES: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  draft: [],
  pending: ["open", "rejected"],
  open: ["closed"],
  closed: [],
  rejected: [],
};

/**
 * An application's life:
 *   submitted → reviewing → shortlisted → interview → offered → hired
 *   any of those (not hired) → rejected         the employer
 *   any live one → withdrawn                    the candidate
 * `hired`, `rejected` and `withdrawn` are final. Staff never move one.
 */
export const APPLICATION_STATUSES = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** The moves an EMPLOYER may make from each status. */
export const EMPLOYER_APPLICATION_MOVES: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  submitted: ["reviewing", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

/** The statuses from which a CANDIDATE may withdraw. */
export const WITHDRAWABLE: readonly ApplicationStatus[] = ["submitted", "reviewing", "shortlisted", "interview", "offered"];

export const FINAL_APPLICATION_STATUSES: readonly ApplicationStatus[] = ["hired", "rejected", "withdrawn"];

/**
 * An employer's verification:
 *   pending → verified | rejected     staff check the company (a rejection carries a note)
 *   verified → suspended              staff take its jobs off the board (with a note)
 *   suspended → verified              staff reinstate it
 *   rejected → verified               the company put it right
 */
export const EMPLOYER_VERIFICATION_STATUSES = ["pending", "verified", "rejected", "suspended"] as const;
export type EmployerVerificationStatus = (typeof EMPLOYER_VERIFICATION_STATUSES)[number];

export const EMPLOYER_VERIFICATION_MOVES: Readonly<
  Record<EmployerVerificationStatus, readonly EmployerVerificationStatus[]>
> = {
  pending: ["verified", "rejected"],
  verified: ["suspended"],
  rejected: ["verified"],
  suspended: ["verified"],
};

/** What staff may set an employer to — never back to `pending`. */
export type EmployerVerificationDecision = Exclude<EmployerVerificationStatus, "pending">;

/** A rejection or a suspension is explained: the note is what the employer reads. */
export const VERIFICATION_NOTE_REQUIRED: readonly EmployerVerificationDecision[] = ["rejected", "suspended"];

/** Today in Amman, as `YYYY-MM-DD`. */
export function ammanToday(now = Date.now()): string {
  return new Date(now + 3 * 3_600_000).toISOString().slice(0, 10);
}

/** Whether a job is on the public board right now: open, from a verified employer, not past its closing date. */
export function isJobPublic(
  job: { readonly status: JobStatus; readonly closesOn?: string },
  employerVerified: boolean,
  today = ammanToday(),
): boolean {
  return job.status === "open" && employerVerified && (!job.closesOn || job.closesOn >= today);
}

/* -------------------------------------------------------------- categories */

/** Staff-managed, like every taxonomy. */
export interface JobCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  /** Jobs filed under it, whatever their status. Computed by the list, never stored. */
  readonly jobCount?: number;
  /** Of those, the ones on the public board. */
  readonly openJobCount?: number;
}

/** The editable part of a job category. */
export type JobCategoryDraft = Omit<JobCategory, "id" | "jobCount" | "openJobCount">;

/* --------------------------------------------------------------- employers */

export interface AdminEmployer {
  readonly id: string;
  readonly slug: string;
  /** As the company wrote it. */
  readonly name: string;
  readonly kind: EmployerKind;
  readonly cityId: JobCity;
  /** As the company wrote it. */
  readonly about: string;
  readonly website?: string;
  readonly size?: EmployerSize;
  /** The public contact for candidates' questions. */
  readonly email: string;
  readonly phone?: string;
  /** The person who opened the account. */
  readonly contactName: string;
  readonly logo?: MediaImage;
  readonly verificationStatus: EmployerVerificationStatus;
  /** Why staff rejected or suspended it — the employer reads it. */
  readonly verificationNote?: string;
  /** The account's sign-in address (`AdminEmployerDto.loginEmail`) — distinct from
   * `email`, the public contact address shown to candidates. They happen to match
   * in the seed data, but the live DTO carries them separately, so both are kept.
   * Optional: the mock store (`mocks/website/types.ts#WebEmployer`) has no concept
   * of a separate login address, so only `httpCareersAdminService` populates this. */
  readonly loginEmail?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Computed, never stored. */
  readonly jobCount: number;
  /** On the public board right now. */
  readonly openJobCount: number;
  /** The live `AdminEmployerDto` has no per-employer pending count at all —
   * only the separate aggregate `GET /admin/careers/pending-count` — so the
   * HTTP adapter always maps this to `0`. */
  readonly pendingJobCount: number;
  readonly applicationCount: number;
}

/** An employer in a picker: `/v1/admin/employers/options`. */
export interface EmployerOption {
  readonly id: string;
  readonly name: string;
  readonly verificationStatus: EmployerVerificationStatus;
}

export const EMPLOYER_SORT_FIELDS = ["name", "verificationStatus", "createdAt", "updatedAt"] as const;
export type EmployerSortField = (typeof EMPLOYER_SORT_FIELDS)[number];

export interface EmployerListQuery extends ListQuery<EmployerSortField> {
  readonly verificationStatuses?: readonly EmployerVerificationStatus[];
}

export interface EmployerVerificationInput {
  readonly status: EmployerVerificationDecision;
  /** Required to reject or suspend. */
  readonly note?: string;
}

/* -------------------------------------------------------------------- jobs */

/** A job, whole, as staff review it — and as the storefront will show it. */
export interface AdminJob {
  readonly id: string;
  readonly slug: string;
  readonly reference: string;
  /** As the employer wrote it. */
  readonly title: string;
  readonly employer: {
    readonly id: string;
    /** The live job DTO is flat (`employerId`/`employerName`/…) with no nested
     * employer bundle — there is no `slug` or `logo` source anywhere on this
     * endpoint, so a job list/detail can't link to the employer's public page
     * or show its logo from this data alone. */
    readonly slug?: string;
    readonly name: string;
    readonly logo?: MediaImage;
    readonly verificationStatus: EmployerVerificationStatus;
  };
  /** Same gap as above: the live DTO has `categoryId`/`categoryName` only, no `categorySlug`. */
  readonly category: { readonly id: string; readonly slug?: string; readonly name: LocalizedText };
  readonly sportIds: readonly string[];
  readonly cityId: JobCity;
  readonly workMode: WorkMode;
  readonly employmentType: EmploymentType;
  readonly experienceLevel: ExperienceLevel;
  readonly salary?: SalaryRange;
  /** Whether the job page publishes the salary range. */
  readonly showSalary: boolean;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly languages: readonly JobLanguage[];
  readonly positions: number;
  /** `YYYY-MM-DD`; absent = open until closed. */
  readonly closesOn?: string;
  readonly status: JobStatus;
  /** Why staff sent it back — the employer reads it. */
  readonly moderationNote?: string;
  readonly featured: boolean;
  /** Set the first time staff approve it. */
  readonly postedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Computed, never stored. */
  readonly applicationCount: number;
  /** On the public board right now. */
  readonly isPublic: boolean;
}

export const JOB_SORT_FIELDS = ["reference", "title", "status", "createdAt", "updatedAt", "applicationCount"] as const;
export type JobSortField = (typeof JOB_SORT_FIELDS)[number];

export interface JobListQuery extends ListQuery<JobSortField> {
  readonly statuses?: readonly JobStatus[];
  readonly employerIds?: readonly string[];
  readonly categoryIds?: readonly string[];
}

export type JobModerationDecision = "approve" | "reject";

export interface JobModerationInput {
  readonly decision: JobModerationDecision;
  /** Required to reject. */
  readonly note?: string;
}

/* ------------------------------------------------------------ applications */

/** A CV's metadata. The bytes are private and only ever downloaded. */
export interface CvFile {
  readonly id: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: number;
}

export interface StatusStep {
  readonly status: ApplicationStatus;
  readonly at: string;
  readonly by: "candidate" | "employer" | "staff";
}

/** An application, read-only. The employer's private note is theirs and is not here. */
export interface AdminJobApplication {
  readonly id: string;
  readonly reference: string;
  /** The live `ApplicationJobRef` is `{id,reference,title,slug,employerName}` —
   * no job status at all, so this is undefined until the API adds one. */
  readonly job: { readonly id: string; readonly reference: string; readonly title: string; readonly status?: JobStatus };
  /** Built from `jobEmployerId` + `job.employerName`: the live DTO has no
   * `employer:{id,name,logo}` bundle, and no logo source at all for it. */
  readonly employer: { readonly id: string; readonly name: string; readonly logo?: MediaImage };
  /** The candidate's customer account. */
  readonly customerId: string;
  readonly candidate: { readonly name: string; readonly email: string; readonly phone?: string };
  readonly cv: CvFile;
  /** As the candidate wrote it. */
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications?: string;
  readonly availableFrom?: string;
  /** Monthly, JOD. */
  readonly expectedSalary?: Money;
  readonly status: ApplicationStatus;
  /** A note the employer sent the candidate with the status. */
  readonly statusNote?: string;
  /** Why the candidate withdrew, when they did — the live DTO has this field
   * with no admin slot previously; kept, since staff reviewing an application
   * would plausibly want to see it. */
  readonly withdrawReason?: string;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly history: readonly StatusStep[];
}

export const APPLICATION_SORT_FIELDS = ["reference", "status", "submittedAt", "updatedAt"] as const;
export type ApplicationSortField = (typeof APPLICATION_SORT_FIELDS)[number];

export interface JobApplicationListQuery extends ListQuery<ApplicationSortField> {
  readonly statuses?: readonly ApplicationStatus[];
  readonly jobIds?: readonly string[];
  readonly employerIds?: readonly string[];
  /** One candidate's applications. */
  readonly customerId?: string;
}

/** A downloaded CV, ready to save. */
export interface DownloadedCv {
  readonly blob: Blob;
  readonly fileName: string;
}

/* ------------------------------------------------------------------ queues */

/** `GET /v1/admin/careers/pending-count`: what is waiting on staff. */
export interface CareersPendingCount {
  /** Employers waiting to be verified. */
  readonly employers: number;
  /** Jobs waiting for review. */
  readonly jobs: number;
}
