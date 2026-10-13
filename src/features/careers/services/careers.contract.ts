import type { ListQuery, Paginated } from "@/types";

import type {
  AdminEmployer,
  AdminJob,
  AdminJobApplication,
  CareersPendingCount,
  DownloadedCv,
  EmployerListQuery,
  EmployerOption,
  EmployerVerificationInput,
  JobApplicationListQuery,
  JobCategory,
  JobCategoryDraft,
  JobListQuery,
  JobModerationInput,
} from "../types";

/**
 * The careers marketplace, as staff work it. Reads need `careers:read`,
 * everything that changes a record `careers:write` — the API enforces both.
 *
 * Lists answer one page (`Paginated`); a page past the end answers the last
 * page. Search matches in either language. Pickers read the whole, short
 * lists (`…/options`).
 */
export interface CareersAdminService {
  /* ---- employers */
  listEmployers(query?: EmployerListQuery): Promise<Paginated<AdminEmployer>>;
  /** Every employer, by name — for the jobs and applications filters. */
  listEmployerOptions(): Promise<readonly EmployerOption[]>;
  getEmployer(id: string): Promise<AdminEmployer | null>;
  /**
   * Verify, reject, suspend or reinstate (verify a suspended one). 422 with
   * `fieldErrors.note` when rejecting or suspending without a note; 409 for a
   * move the verification graph does not allow.
   */
  setEmployerVerification(id: string, input: EmployerVerificationInput): Promise<AdminEmployer>;

  /* ---- jobs */
  listJobs(query?: JobListQuery): Promise<Paginated<AdminJob>>;
  getJob(id: string): Promise<AdminJob | null>;
  /**
   * `approve`: pending → open, 409 unless the employer is verified; sets
   * `postedAt` the first time. `reject`: pending → rejected, 422 with
   * `fieldErrors.note` without a note. 409 when the job is not pending.
   */
  moderateJob(id: string, input: JobModerationInput): Promise<AdminJob>;
  /** 409 to feature a job that is not open; unfeaturing always works. */
  setJobFeatured(id: string, featured: boolean): Promise<AdminJob>;
  /** open → closed; 409 otherwise. */
  closeJob(id: string): Promise<AdminJob>;
  /** 409 while anyone has applied: those applications are history. */
  deleteJob(id: string): Promise<void>;

  /* ---- applications (read-only) */
  listApplications(query?: JobApplicationListQuery): Promise<Paginated<AdminJobApplication>>;
  getApplication(id: string): Promise<AdminJobApplication | null>;
  /** The CV's bytes. Private: never cached. */
  downloadCv(applicationId: string): Promise<DownloadedCv>;

  /* ---- categories */
  /** One page for the categories table; `search` matches either name or the slug. */
  listCategoriesPage(query: ListQuery): Promise<Paginated<JobCategory>>;
  /** Every category, with its counts — for the jobs filter. */
  listCategories(): Promise<readonly JobCategory[]>;
  /** 422 with field errors when a name is missing or the slug is malformed or taken. */
  createCategory(draft: JobCategoryDraft): Promise<JobCategory>;
  updateCategory(id: string, draft: JobCategoryDraft): Promise<JobCategory>;
  /** 409 while any job is filed under it. */
  deleteCategory(id: string): Promise<void>;

  /** Employers to verify and jobs to review. */
  countPending(): Promise<CareersPendingCount>;
}
