import { adminListParams, httpClient, httpDownload, orNull } from "@/services";
import type { LocalizedText, Money, Paginated } from "@/types";

import type {
  AdminEmployer,
  AdminJob,
  AdminJobApplication,
  ApplicationStatus,
  CareersPendingCount,
  EmployerKind,
  EmployerOption,
  EmployerSize,
  EmployerVerificationStatus,
  EmploymentType,
  ExperienceLevel,
  JobCategory,
  JobCity,
  JobLanguage,
  JobStatus,
  SalaryPeriod,
  StatusStep,
  WorkMode,
} from "../types";
import type { CareersAdminService } from "./careers.contract";

const enc = encodeURIComponent;

/* ---------------------------------------------------------------------- *
 * Wire DTOs — the live API's shapes (`docs/api-live/admin.json`), kept
 * local and minimal (only the fields the mappers below actually read).
 * ---------------------------------------------------------------------- */

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

interface SalaryDto {
  readonly min?: MoneyDto | null;
  readonly max?: MoneyDto | null;
  readonly period: string;
}

/**
 * Real bug fixed: every one of this file's list endpoints actually answers the
 * admin's own nested envelope — `{items, meta:{page, pageSize, totalItems,
 * totalPages, hasPreviousPage, hasNextPage}}` — confirmed by calling each
 * endpoint directly against the live API. The flat `{items, page, pageSize,
 * totalCount, totalPages, hasPreviousPage, hasNextPage}` shape this file
 * assumed (and which the captured `docs/api-live/admin.json` and even the
 * live OpenAPI schema still describe) never actually appears on the wire for
 * `/v1/admin/employers`, `/v1/admin/jobs`, `/v1/admin/job-applications` or
 * `/v1/admin/job-categories` — those flat fields are simply absent from the
 * JSON, so the old code here read `page.page`/`page.totalCount`/etc. as
 * `undefined` every time, producing `{page: undefined, totalItems: undefined,
 * totalPages: NaN, hasNextPage: false, hasPreviousPage: false}` for every
 * list in this domain. `quotations.http.ts`, `support.http.ts` and
 * `sports.http.ts` already read this same nested shape correctly; this just
 * brings careers in line with them (and with `Paginated<T>` itself).
 */
function toPaginated<TDto, TItem>(page: Paginated<TDto>, map: (dto: TDto) => TItem): Paginated<TItem> {
  return { items: page.items.map(map), meta: page.meta };
}

interface AdminEmployerDto {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly kind: string;
  readonly cityId: string;
  readonly about?: string | null;
  readonly website?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly contactName: string;
  readonly size?: string | null;
  readonly logo?: MediaImageDto | null;
  readonly verificationStatus: string;
  readonly verificationNote?: string | null;
  readonly loginEmail: string;
  readonly jobCount: number;
  readonly openJobCount: number;
  readonly applicationCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface EmployerOptionDto {
  readonly id: number;
  readonly name: string;
  readonly verificationStatus: string;
}

interface AdminJobDto {
  readonly id: number;
  readonly reference: string;
  readonly slug: string;
  readonly title: string;
  readonly employerId: number;
  readonly employerName: string;
  readonly employerVerificationStatus: string;
  readonly categoryId: number;
  readonly categoryName: LocalizedText;
  readonly sportIds: readonly number[];
  readonly cityId: string;
  readonly employmentType: string;
  readonly workMode: string;
  readonly experienceLevel: string;
  readonly salary?: SalaryDto | null;
  readonly showSalary: boolean;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly languages: readonly string[];
  readonly positions: number;
  readonly closesOn?: string | null;
  readonly status: string;
  readonly moderationNote?: string | null;
  readonly featured: boolean;
  readonly isPublic: boolean;
  readonly applicationCount: number;
  readonly postedAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface ApplicationJobRefDto {
  readonly id: number;
  readonly reference: string;
  readonly title: string;
  readonly slug: string;
  readonly employerName: string;
}

interface CandidateDto {
  readonly name: string;
  readonly email: string;
  readonly phone?: string | null;
}

interface CvFileDto {
  readonly id: number;
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: number;
}

interface HistoryDto {
  readonly status: string;
  readonly at: string;
  readonly by: string;
}

interface AdminJobApplicationDto {
  readonly id: number;
  readonly reference: string;
  readonly job: ApplicationJobRefDto;
  /** Flat — no nested `employer` bundle live, just the id. */
  readonly jobEmployerId: number;
  readonly customerId: number;
  readonly candidate: CandidateDto;
  readonly status: string;
  readonly statusNote?: string | null;
  readonly withdrawReason?: string | null;
  readonly history: readonly HistoryDto[];
  readonly cv: CvFileDto;
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications?: string | null;
  readonly availableFrom?: string | null;
  readonly expectedSalary?: MoneyDto | null;
  readonly submittedAt: string;
  readonly updatedAt?: string;
}

interface AdminJobCategoryDto {
  readonly id: number;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly jobCount: number;
  readonly openJobCount: number;
}

/* ---------------------------------------------------------------------- *
 * DTO -> domain mapping, modelled on the sibling careers.mock.ts's
 * `toAdminEmployer`/`toAdminJob`/`toAdminApplication`/`toCategory`.
 * ---------------------------------------------------------------------- */

function toMediaImage(dto: MediaImageDto | null | undefined) {
  if (!dto) return undefined;
  return {
    kind: "image" as const,
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    width: dto.width ?? undefined,
    height: dto.height ?? undefined,
  };
}

function toMoney(dto: MoneyDto | null | undefined): Money | undefined {
  if (!dto) return undefined;
  return { amount: dto.amount, currency: (dto.currency as Money["currency"] | undefined) ?? "JOD" };
}

function toAdminEmployer(dto: AdminEmployerDto): AdminEmployer {
  return {
    id: String(dto.id),
    slug: dto.slug,
    name: dto.name,
    kind: dto.kind as EmployerKind,
    cityId: dto.cityId as JobCity,
    about: dto.about ?? "",
    website: dto.website ?? undefined,
    size: (dto.size as EmployerSize | null | undefined) ?? undefined,
    email: dto.email ?? "",
    phone: dto.phone ?? undefined,
    contactName: dto.contactName,
    logo: toMediaImage(dto.logo),
    verificationStatus: dto.verificationStatus as EmployerVerificationStatus,
    verificationNote: dto.verificationNote ?? undefined,
    loginEmail: dto.loginEmail,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    jobCount: dto.jobCount,
    openJobCount: dto.openJobCount,
    // The live DTO doesn't compute a per-employer pending count; see the
    // doc-comment on `AdminEmployer.pendingJobCount` in ../types.ts.
    pendingJobCount: 0,
    applicationCount: dto.applicationCount,
  };
}

function toEmployerOption(dto: EmployerOptionDto): EmployerOption {
  return { id: String(dto.id), name: dto.name, verificationStatus: dto.verificationStatus as EmployerVerificationStatus };
}

function toAdminJob(dto: AdminJobDto): AdminJob {
  return {
    id: String(dto.id),
    slug: dto.slug,
    reference: dto.reference,
    title: dto.title,
    // Built from the flat employerId/employerName/employerVerificationStatus
    // fields — see the doc-comment on `AdminJob.employer` in ../types.ts for
    // why `slug`/`logo` have nothing to read from here.
    employer: {
      id: String(dto.employerId),
      name: dto.employerName,
      verificationStatus: dto.employerVerificationStatus as EmployerVerificationStatus,
    },
    // Same story for `category.slug`: the live DTO is categoryId/categoryName only.
    category: { id: String(dto.categoryId), name: dto.categoryName },
    sportIds: dto.sportIds.map(String),
    cityId: dto.cityId as JobCity,
    workMode: dto.workMode as WorkMode,
    employmentType: dto.employmentType as EmploymentType,
    experienceLevel: dto.experienceLevel as ExperienceLevel,
    salary: dto.salary
      ? { min: toMoney(dto.salary.min), max: toMoney(dto.salary.max), period: dto.salary.period as SalaryPeriod }
      : undefined,
    showSalary: dto.showSalary,
    description: dto.description,
    requirements: dto.requirements,
    benefits: dto.benefits,
    languages: dto.languages as readonly JobLanguage[],
    positions: dto.positions,
    closesOn: dto.closesOn ?? undefined,
    status: dto.status as JobStatus,
    moderationNote: dto.moderationNote ?? undefined,
    featured: dto.featured,
    postedAt: dto.postedAt ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    applicationCount: dto.applicationCount,
    isPublic: dto.isPublic,
  };
}

function toAdminApplication(dto: AdminJobApplicationDto): AdminJobApplication {
  return {
    id: String(dto.id),
    reference: dto.reference,
    // The live ApplicationJobRef has no job status at all — see ../types.ts.
    job: { id: String(dto.job.id), reference: dto.job.reference, title: dto.job.title },
    // No nested employer bundle live; built from jobEmployerId + job.employerName,
    // with no logo source at all — see ../types.ts.
    employer: { id: String(dto.jobEmployerId), name: dto.job.employerName },
    customerId: String(dto.customerId),
    candidate: { name: dto.candidate.name, email: dto.candidate.email, phone: dto.candidate.phone ?? undefined },
    cv: { id: String(dto.cv.id), fileName: dto.cv.fileName, mimeType: dto.cv.mimeType, bytes: dto.cv.bytes },
    coverLetter: dto.coverLetter,
    yearsExperience: dto.yearsExperience,
    certifications: dto.certifications ?? undefined,
    availableFrom: dto.availableFrom ?? undefined,
    expectedSalary: toMoney(dto.expectedSalary),
    status: dto.status as ApplicationStatus,
    statusNote: dto.statusNote ?? undefined,
    withdrawReason: dto.withdrawReason ?? undefined,
    submittedAt: dto.submittedAt,
    updatedAt: dto.updatedAt ?? dto.submittedAt,
    history: dto.history.map(
      (step): StatusStep => ({ status: step.status as ApplicationStatus, at: step.at, by: step.by as StatusStep["by"] }),
    ),
  };
}

function toJobCategory(dto: AdminJobCategoryDto): JobCategory {
  return { id: String(dto.id), slug: dto.slug, name: dto.name, jobCount: dto.jobCount, openJobCount: dto.openJobCount };
}

/**
 * The careers marketplace over `/v1/admin/employers`, `/v1/admin/jobs`,
 * `/v1/admin/job-applications` and `/v1/admin/job-categories`. Reads need
 * `careers:read`, writes `careers:write`.
 *
 * A CV is fetched with the staff member's bearer token from
 * `GET /v1/admin/job-applications/:id/cv` (private, never cached).
 */
export const httpCareersAdminService: CareersAdminService = {
  listEmployers: async (query = {}) =>
    toPaginated(
      await httpClient.get<Paginated<AdminEmployerDto>>("/v1/admin/employers", {
        query: { ...adminListParams(query), verificationStatuses: query.verificationStatuses },
        auth: true,
      }),
      toAdminEmployer,
    ),
  listEmployerOptions: async () =>
    (await httpClient.get<EmployerOptionDto[]>("/v1/admin/employers/options", { auth: true })).map(toEmployerOption),
  getEmployer: async (id) => {
    const dto = await orNull(httpClient.get<AdminEmployerDto>(`/v1/admin/employers/${enc(id)}`, { auth: true }));
    return dto ? toAdminEmployer(dto) : null;
  },
  setEmployerVerification: async (id, input) =>
    toAdminEmployer(
      await httpClient.put<AdminEmployerDto>(`/v1/admin/employers/${enc(id)}/verification`, input, { auth: true }),
    ),

  listJobs: async (query = {}) =>
    toPaginated(
      await httpClient.get<Paginated<AdminJobDto>>("/v1/admin/jobs", {
        query: {
          ...adminListParams(query),
          statuses: query.statuses,
          employerIds: query.employerIds,
          categoryIds: query.categoryIds,
        },
        auth: true,
      }),
      toAdminJob,
    ),
  getJob: async (id) => {
    const dto = await orNull(httpClient.get<AdminJobDto>(`/v1/admin/jobs/${enc(id)}`, { auth: true }));
    return dto ? toAdminJob(dto) : null;
  },
  moderateJob: async (id, input) =>
    toAdminJob(await httpClient.put<AdminJobDto>(`/v1/admin/jobs/${enc(id)}/moderation`, input, { auth: true })),
  setJobFeatured: async (id, featured) =>
    toAdminJob(await httpClient.put<AdminJobDto>(`/v1/admin/jobs/${enc(id)}/featured`, { featured }, { auth: true })),
  closeJob: async (id) => toAdminJob(await httpClient.post<AdminJobDto>(`/v1/admin/jobs/${enc(id)}/close`, undefined, { auth: true })),
  deleteJob: async (id) => {
    await httpClient.delete<void>(`/v1/admin/jobs/${enc(id)}`, { auth: true });
  },

  listApplications: async (query = {}) =>
    toPaginated(
      await httpClient.get<Paginated<AdminJobApplicationDto>>("/v1/admin/job-applications", {
        query: {
          ...adminListParams(query),
          statuses: query.statuses,
          jobIds: query.jobIds,
          employerIds: query.employerIds,
          customerId: query.customerId,
        },
        auth: true,
      }),
      toAdminApplication,
    ),
  getApplication: async (id) => {
    const dto = await orNull(httpClient.get<AdminJobApplicationDto>(`/v1/admin/job-applications/${enc(id)}`, { auth: true }));
    return dto ? toAdminApplication(dto) : null;
  },
  downloadCv: (applicationId) => httpDownload(`/v1/admin/job-applications/${enc(applicationId)}/cv`),

  listCategoriesPage: async (query) =>
    toPaginated(
      await httpClient.get<Paginated<AdminJobCategoryDto>>("/v1/admin/job-categories", {
        query: adminListParams(query),
        auth: true,
      }),
      toJobCategory,
    ),
  listCategories: async () =>
    (await httpClient.get<AdminJobCategoryDto[]>("/v1/admin/job-categories/options", { auth: true })).map(toJobCategory),
  createCategory: async (draft) =>
    toJobCategory(await httpClient.post<AdminJobCategoryDto>("/v1/admin/job-categories", draft, { auth: true })),
  updateCategory: async (id, draft) =>
    toJobCategory(await httpClient.put<AdminJobCategoryDto>(`/v1/admin/job-categories/${enc(id)}`, draft, { auth: true })),
  deleteCategory: async (id) => {
    await httpClient.delete<void>(`/v1/admin/job-categories/${enc(id)}`, { auth: true });
  },

  // CareersPendingCountDto already matches CareersPendingCount exactly — no mapping needed.
  countPending: () => httpClient.get<CareersPendingCount>("/v1/admin/careers/pending-count", { auth: true }),
};
