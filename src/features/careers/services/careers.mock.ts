import { DEFAULT_LOCALE, type Locale } from "@/i18n/locales";
import { AppError, localize, notFound, nowIso, paginate, validationFailed } from "@/lib";
import { fetchStorefrontCv, pushToStorefront } from "@/mocks/bridge";
import { mockEmployers, mockJobApplications, mockJobCategories, mockJobCityNames, mockJobs } from "@/mocks/careers";
import { localizedValues, matchesText, simulateLatency, sortRows } from "@/mocks/runtime";
import type { WebEmployer, WebJob, WebJobApplication, WebJobCategory } from "@/mocks/website/types";
import type { ListQuery, LocalizedText } from "@/types";

import {
  EMPLOYER_VERIFICATION_MOVES,
  STAFF_JOB_MOVES,
  VERIFICATION_NOTE_REQUIRED,
  isJobPublic,
  type AdminEmployer,
  type AdminJob,
  type AdminJobApplication,
  type ApplicationSortField,
  type EmployerSortField,
  type EmployerVerificationDecision,
  type JobCategory,
  type JobCategoryDraft,
  type JobSortField,
} from "../types";
import type { CareersAdminService } from "./careers.contract";

/**
 * The careers marketplace over the admin's copy of the storefront's store
 * (`mocks/careers`, kept current by the dev bridge). Every decision is made
 * here — refused here when the graph does not allow it — and then pushed to
 * the storefront, which tells the employer.
 *
 * The arrays hold the storefront's raw records; the views staff read (counts,
 * what is public) are built at read time, so a re-read of the store never
 * leaves one stale.
 */

const NOTE_MAX = 1000;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DECISIONS: readonly EmployerVerificationDecision[] = ["verified", "rejected", "suspended"];

/* ------------------------------------------------------------------ views */

const employerOf = (id: string) => mockEmployers.find((entry) => entry.id === id);
const isVerified = (employerId: string) => employerOf(employerId)?.verificationStatus === "verified";
const publicJob = (job: WebJob) => isJobPublic(job, isVerified(job.employerId));
const applicationsOf = (jobId: string) => mockJobApplications.filter((entry) => entry.jobId === jobId);

const MISSING_CATEGORY: LocalizedText = { en: "Unfiled", ar: "بلا تصنيف" };

function toAdminEmployer(employer: WebEmployer): AdminEmployer {
  const jobs = mockJobs.filter((job) => job.employerId === employer.id);
  return {
    ...employer,
    jobCount: jobs.length,
    openJobCount: jobs.filter(publicJob).length,
    pendingJobCount: jobs.filter((job) => job.status === "pending").length,
    applicationCount: mockJobApplications.filter((entry) => entry.employerId === employer.id).length,
  };
}

function toAdminJob(job: WebJob): AdminJob {
  const employer = employerOf(job.employerId);
  const category = mockJobCategories.find((entry) => entry.id === job.categoryId);
  const { employerId, categoryId, ...rest } = job;
  return {
    ...rest,
    employer: {
      id: employerId,
      slug: employer?.slug ?? employerId,
      name: employer?.name ?? employerId,
      logo: employer?.logo,
      verificationStatus: employer?.verificationStatus ?? "pending",
    },
    category: { id: categoryId, slug: category?.slug ?? categoryId, name: category?.name ?? MISSING_CATEGORY },
    applicationCount: applicationsOf(job.id).length,
    isPublic: publicJob(job),
  };
}

function toAdminApplication(entry: WebJobApplication): AdminJobApplication {
  const job = mockJobs.find((row) => row.id === entry.jobId);
  const employer = employerOf(entry.employerId);
  return {
    id: entry.id,
    reference: entry.reference,
    job: { id: entry.jobId, reference: job?.reference ?? entry.jobId, title: job?.title ?? entry.jobId, status: job?.status ?? "closed" },
    employer: { id: entry.employerId, name: employer?.name ?? entry.employerId, logo: employer?.logo },
    customerId: entry.customerId,
    candidate: entry.candidate,
    cv: entry.cv,
    coverLetter: entry.coverLetter,
    yearsExperience: entry.yearsExperience,
    certifications: entry.certifications,
    availableFrom: entry.availableFrom,
    expectedSalary: entry.expectedSalary,
    status: entry.status,
    statusNote: entry.statusNote,
    submittedAt: entry.submittedAt,
    updatedAt: entry.updatedAt,
    history: entry.history,
  };
}

function toCategory(category: WebJobCategory): JobCategory {
  const jobs = mockJobs.filter((job) => job.categoryId === category.id);
  return { ...category, jobCount: jobs.length, openJobCount: jobs.filter(publicJob).length };
}

/* ---------------------------------------------------------------- helpers */

const conflict = (message: string) => new AppError("conflict", message, { status: 409 });

function requireEmployerIndex(id: string): number {
  const index = mockEmployers.findIndex((entry) => entry.id === id);
  if (index < 0) throw notFound(`Employer "${id}"`);
  return index;
}

function requireJobIndex(id: string): number {
  const index = mockJobs.findIndex((entry) => entry.id === id);
  if (index < 0) throw notFound(`Job "${id}"`);
  return index;
}

/** A staff note: trimmed, at most 1000 characters, required when `required`. */
function readNote(value: unknown, required: boolean, missing: string): string | undefined {
  const note = typeof value === "string" ? value.trim() : "";
  if (required && !note) throw validationFailed({ note: missing });
  if (note.length > NOTE_MAX) throw validationFailed({ note: `At most ${NOTE_MAX} characters.` });
  return note || undefined;
}

/** City names in both languages, so a search in either finds the record. */
const cityText = (cityId: WebEmployer["cityId"]) => localizedValues(mockJobCityNames[cityId]);

const count = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`);

/** A readable id (`jc-nutrition`); a short random tail only when it is taken. */
function newCategoryId(slug: string): string {
  const stem = `jc-${slug}`;
  return mockJobCategories.some((row) => row.id === stem) ? `${stem}-${Math.random().toString(36).slice(2, 7)}` : stem;
}

/** Both names and a well-formed, free slug. */
function validateCategory(draft: JobCategoryDraft, id?: string): JobCategoryDraft {
  const errors: Record<string, string> = {};
  const name = { en: (draft.name?.en ?? "").trim(), ar: (draft.name?.ar ?? "").trim() };
  if (!name.en) errors["name.en"] = "Required.";
  if (!name.ar) errors["name.ar"] = "Required.";
  const slug = (draft.slug ?? "").trim();
  if (!SLUG.test(slug)) errors.slug = "Lower-case letters, numbers and hyphens, e.g. personal-training.";
  else if (mockJobCategories.some((category) => category.slug === slug && category.id !== id)) {
    errors.slug = "Another category already uses this address.";
  }
  if (Object.keys(errors).length > 0) throw validationFailed(errors);
  return { slug, name };
}

/** Employers waiting on staff first, then the newest. */
const VERIFICATION_ORDER: Readonly<Record<WebEmployer["verificationStatus"], number>> = {
  pending: 0,
  suspended: 1,
  rejected: 2,
  verified: 3,
};

function sortEmployers(rows: readonly AdminEmployer[], query: ListQuery<EmployerSortField>, locale: Locale): AdminEmployer[] {
  if (!query.sort) {
    return [...rows].sort(
      (a, b) =>
        VERIFICATION_ORDER[a.verificationStatus] - VERIFICATION_ORDER[b.verificationStatus] ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }
  const { field, direction } = query.sort;
  if (field === "name") {
    const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base", numeric: true }));
    return direction === "desc" ? sorted.reverse() : sorted;
  }
  const select = (row: AdminEmployer) =>
    field === "verificationStatus" ? VERIFICATION_ORDER[row.verificationStatus] : row[field];
  return sortRows(rows, select, direction);
}

function sortJobs(rows: readonly AdminJob[], query: ListQuery<JobSortField>, locale: Locale): AdminJob[] {
  if (!query.sort) return sortRows(rows, (row) => row.updatedAt, "desc");
  const { field, direction } = query.sort;
  if (field === "title") {
    const sorted = [...rows].sort((a, b) => a.title.localeCompare(b.title, locale, { sensitivity: "base", numeric: true }));
    return direction === "desc" ? sorted.reverse() : sorted;
  }
  return sortRows(rows, (row) => row[field], direction);
}

function sortApplications(rows: readonly AdminJobApplication[], query: ListQuery<ApplicationSortField>): AdminJobApplication[] {
  if (!query.sort) return sortRows(rows, (row) => row.submittedAt, "desc");
  const { field, direction } = query.sort;
  return sortRows(rows, (row) => row[field], direction);
}

/* ---------------------------------------------------------------- service */

export const mockCareersAdminService: CareersAdminService = {
  /* ---- employers */

  async listEmployers(query = {}) {
    await simulateLatency();
    const rows = mockEmployers
      .filter((employer) => {
        if (query.verificationStatuses?.length && !query.verificationStatuses.includes(employer.verificationStatus)) {
          return false;
        }
        return matchesText(
          [employer.name, employer.slug, employer.email, employer.contactName, employer.phone, ...cityText(employer.cityId)],
          query.search,
        );
      })
      .map(toAdminEmployer);
    return paginate(sortEmployers(rows, query, query.locale ?? DEFAULT_LOCALE), query);
  },

  async listEmployerOptions() {
    await simulateLatency();
    return [...mockEmployers]
      .sort((a, b) => a.name.localeCompare(b.name, DEFAULT_LOCALE, { sensitivity: "base" }))
      .map((employer) => ({ id: employer.id, name: employer.name, verificationStatus: employer.verificationStatus }));
  },

  async getEmployer(id) {
    await simulateLatency();
    const employer = employerOf(id);
    return employer ? toAdminEmployer(employer) : null;
  },

  async setEmployerVerification(id, input) {
    await simulateLatency();
    const status = input?.status;
    if (!DECISIONS.includes(status)) {
      throw validationFailed({ status: "Choose verified, rejected or suspended." });
    }
    const note = readNote(
      input.note,
      VERIFICATION_NOTE_REQUIRED.includes(status),
      status === "rejected" ? "Tell the company why it cannot be verified." : "Tell the company why it is suspended.",
    );
    const index = requireEmployerIndex(id);
    const current = mockEmployers[index]!;
    if (!EMPLOYER_VERIFICATION_MOVES[current.verificationStatus].includes(status)) {
      throw conflict(
        current.verificationStatus === status
          ? `${current.name} is already ${status}.`
          : `An employer that is ${current.verificationStatus} cannot be ${status}.`,
      );
    }
    /* Verifying clears an old refusal's note: it is no longer why anything is so. */
    const verificationNote = status === "verified" ? undefined : note;
    const { verificationNote: _previous, ...kept } = current;
    const updated: WebEmployer = { ...kept, verificationStatus: status, ...(verificationNote ? { verificationNote } : {}), updatedAt: nowIso() };
    mockEmployers[index] = updated;
    /* `null` clears the storefront's note; `undefined` would leave it. */
    pushToStorefront("employer", id, { verificationStatus: status, verificationNote: verificationNote ?? null });
    return toAdminEmployer(updated);
  },

  /* ---- jobs */

  async listJobs(query = {}) {
    await simulateLatency();
    const rows = mockJobs
      .filter((job) => {
        if (query.statuses?.length && !query.statuses.includes(job.status)) return false;
        if (query.employerIds?.length && !query.employerIds.includes(job.employerId)) return false;
        if (query.categoryIds?.length && !query.categoryIds.includes(job.categoryId)) return false;
        const employer = employerOf(job.employerId);
        const category = mockJobCategories.find((entry) => entry.id === job.categoryId);
        return matchesText(
          [
            job.title,
            job.reference,
            job.slug,
            employer?.name,
            ...localizedValues(category?.name),
            ...cityText(job.cityId),
          ],
          query.search,
        );
      })
      .map(toAdminJob);
    return paginate(sortJobs(rows, query, query.locale ?? DEFAULT_LOCALE), query);
  },

  async getJob(id) {
    await simulateLatency();
    const job = mockJobs.find((entry) => entry.id === id);
    return job ? toAdminJob(job) : null;
  },

  async moderateJob(id, input) {
    await simulateLatency();
    const decision = input?.decision;
    if (decision !== "approve" && decision !== "reject") {
      throw validationFailed({ decision: "Approve or reject." });
    }
    const note = readNote(input.note, decision === "reject", "Tell the employer what to change.");
    const index = requireJobIndex(id);
    const current = mockJobs[index]!;
    const next = decision === "approve" ? "open" : "rejected";
    if (!STAFF_JOB_MOVES[current.status].includes(next)) {
      throw conflict(`Only a job waiting for review can be ${decision === "approve" ? "approved" : "rejected"}. This one is ${current.status}.`);
    }
    if (decision === "approve") {
      const employer = employerOf(current.employerId);
      if (employer?.verificationStatus !== "verified") {
        throw conflict(
          `${employer?.name ?? "The employer"} is not verified, so its jobs cannot go live. Verify the employer first.`,
        );
      }
    }
    const now = nowIso();
    const { moderationNote: _previous, ...kept } = current;
    const updated: WebJob =
      decision === "approve"
        ? /* The first approval is when it was posted; a re-approval keeps that date. */
          { ...kept, status: "open", postedAt: current.postedAt ?? now, updatedAt: now }
        : { ...kept, status: "rejected", moderationNote: note, updatedAt: now };
    mockJobs[index] = updated;
    pushToStorefront(
      "job",
      id,
      decision === "approve"
        ? { status: "open", moderationNote: null, postedAt: updated.postedAt }
        : { status: "rejected", moderationNote: note },
    );
    return toAdminJob(updated);
  },

  async setJobFeatured(id, featured) {
    await simulateLatency();
    if (typeof featured !== "boolean") throw validationFailed({ featured: "True or false." });
    const index = requireJobIndex(id);
    const current = mockJobs[index]!;
    if (featured && current.status !== "open") {
      throw conflict(`Only an open job can be featured. This one is ${current.status}.`);
    }
    const updated: WebJob = { ...current, featured, updatedAt: nowIso() };
    mockJobs[index] = updated;
    pushToStorefront("job", id, { featured });
    return toAdminJob(updated);
  },

  async closeJob(id) {
    await simulateLatency();
    const index = requireJobIndex(id);
    const current = mockJobs[index]!;
    if (!STAFF_JOB_MOVES[current.status].includes("closed")) {
      throw conflict(`Only an open job can be closed. This one is ${current.status}.`);
    }
    const updated: WebJob = { ...current, status: "closed", updatedAt: nowIso() };
    mockJobs[index] = updated;
    pushToStorefront("job", id, { status: "closed" });
    return toAdminJob(updated);
  },

  async deleteJob(id) {
    await simulateLatency();
    const index = requireJobIndex(id);
    const applied = applicationsOf(id).length;
    if (applied > 0) {
      throw conflict(
        `${count(applied, "person has", "people have")} applied for this job, so it is kept as their record. Close it instead.`,
      );
    }
    mockJobs.splice(index, 1);
    /* The storefront holds the copy the bridge mirrors; without this it would come back on the next poll. */
    pushToStorefront("job", id, {}, "delete");
  },

  /* ---- applications */

  async listApplications(query = {}) {
    await simulateLatency();
    const rows = mockJobApplications
      .filter((entry) => {
        if (query.statuses?.length && !query.statuses.includes(entry.status)) return false;
        if (query.jobIds?.length && !query.jobIds.includes(entry.jobId)) return false;
        if (query.employerIds?.length && !query.employerIds.includes(entry.employerId)) return false;
        if (query.customerId && entry.customerId !== query.customerId) return false;
        const job = mockJobs.find((row) => row.id === entry.jobId);
        return matchesText(
          [
            entry.reference,
            entry.candidate.name,
            entry.candidate.email,
            entry.candidate.phone,
            job?.title,
            job?.reference,
            employerOf(entry.employerId)?.name,
          ],
          query.search,
        );
      })
      .map(toAdminApplication);
    return paginate(sortApplications(rows, query), query);
  },

  async getApplication(id) {
    await simulateLatency();
    const entry = mockJobApplications.find((row) => row.id === id);
    return entry ? toAdminApplication(entry) : null;
  },

  async downloadCv(applicationId) {
    if (!mockJobApplications.some((row) => row.id === applicationId)) throw notFound(`Application "${applicationId}"`);
    return fetchStorefrontCv(applicationId);
  },

  /* ---- categories */

  async listCategoriesPage(query) {
    await simulateLatency();
    const locale = query.locale ?? DEFAULT_LOCALE;
    const rows = mockJobCategories
      .filter((category) => matchesText([...localizedValues(category.name), category.slug], query.search))
      .map(toCategory);
    const direction = query.sort?.direction ?? "asc";
    const field = query.sort?.field;
    const sorted =
      field === "slug" || field === "jobCount"
        ? sortRows(rows, (row) => (field === "slug" ? row.slug : (row.jobCount ?? 0)), direction)
        : (() => {
            const byName = [...rows].sort((a, b) =>
              localize(a.name, locale).localeCompare(localize(b.name, locale), locale, { sensitivity: "base" }),
            );
            return direction === "desc" ? byName.reverse() : byName;
          })();
    return paginate(sorted, query);
  },

  async listCategories() {
    await simulateLatency();
    return mockJobCategories.map(toCategory);
  },

  async createCategory(draft) {
    await simulateLatency();
    const clean = validateCategory(draft);
    const category: WebJobCategory = { id: newCategoryId(clean.slug), ...clean };
    mockJobCategories.push(category);
    pushToStorefront("job-category", category.id, { slug: category.slug, name: category.name }, "put");
    return toCategory(category);
  },

  async updateCategory(id, draft) {
    await simulateLatency();
    const index = mockJobCategories.findIndex((category) => category.id === id);
    if (index < 0) throw notFound(`Job category "${id}"`);
    const category: WebJobCategory = { id, ...validateCategory(draft, id) };
    mockJobCategories[index] = category;
    pushToStorefront("job-category", id, { slug: category.slug, name: category.name }, "put");
    return toCategory(category);
  },

  async deleteCategory(id) {
    await simulateLatency();
    const index = mockJobCategories.findIndex((category) => category.id === id);
    if (index < 0) throw notFound(`Job category "${id}"`);
    const used = mockJobs.filter((job) => job.categoryId === id).length;
    if (used > 0) {
      throw conflict(
        `${count(used, "job is", "jobs are")} filed under this category, so it cannot be deleted. Rename it instead, or wait until they are gone.`,
      );
    }
    mockJobCategories.splice(index, 1);
    pushToStorefront("job-category", id, {}, "delete");
  },

  async countPending() {
    await simulateLatency();
    return {
      employers: mockEmployers.filter((employer) => employer.verificationStatus === "pending").length,
      jobs: mockJobs.filter((job) => job.status === "pending").length,
    };
  },
};
