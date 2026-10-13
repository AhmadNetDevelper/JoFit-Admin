import type {
  ApplicationStatus,
  CvFile,
  EmployerKind,
  EmployerSize,
  EmployerVerificationStatus,
  EmploymentType,
  ExperienceLevel,
  JobCity,
  JobLanguage,
  JobStatus,
  SalaryRange,
  StatusStep,
  WorkMode,
} from "@/features/careers";
import type { StorefrontTheme } from "@/features/settings";
import type { LocalizedText, Media, MediaImage, Money, RatingSummary } from "@/types";

/**
 * THE STOREFRONT'S CATALOGUE, AS THE ADMIN RECEIVES IT.
 *
 * These are the shapes `scripts/sync-website-mocks.cjs` writes into
 * `snapshot.ts`: the public records the storefront renders, projected to the
 * fields the admin builds its write models from. Nothing outside `src/mocks`
 * sees them — each domain's fixture file maps them into that domain's admin
 * model and adds what only staff see (exact stock, cost, verification, audit).
 *
 * Why a snapshot rather than typing the catalogue twice: the two apps drifted
 * the moment they had separate fixtures. The admin listed six products, four
 * coaches and three courses that did not exist on the site, so a staff member
 * "verifying" a coach was looking at someone the public never saw. One source,
 * regenerated on demand, is what keeps "the product in the admin" and "the
 * product on the site" the same product.
 *
 * All of this is deleted with the rest of `src/mocks` when the API lands.
 */
export interface WebSport {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly isFeatured: boolean;
  readonly image?: MediaImage;
}

export interface WebBrand {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: LocalizedText;
  readonly logo?: MediaImage;
}

export interface WebCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly description?: LocalizedText;
  readonly parentId: string | null;
  readonly sportIds: readonly string[];
  readonly image?: MediaImage;
}

export interface WebProductVariant {
  readonly id: string;
  readonly sku: string;
  readonly title: string;
  readonly selections: Readonly<Record<string, string>>;
  readonly price: Money;
  readonly compareAt?: Money;
  readonly stockStatus: "in-stock" | "low-stock" | "out-of-stock" | "pre-order";
}

export interface WebProduct {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly description: LocalizedText;
  readonly brandId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly options: readonly {
    readonly key: string;
    readonly name: LocalizedText;
    readonly values: readonly string[];
  }[];
  readonly variants: readonly WebProductVariant[];
  readonly rating: RatingSummary;
  readonly publishedAt: string;
  readonly media: readonly Media[];
}

export interface WebLocation {
  readonly id: string;
  readonly name: LocalizedText;
  readonly city: LocalizedText;
  readonly countryCode: string;
}

export interface WebRentalItem {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly rates: readonly {
    readonly unit: "hour" | "day" | "week";
    readonly price: Money;
    readonly minUnits: number;
    readonly maxUnits?: number;
  }[];
  readonly deposit?: Money;
  readonly locationId: string;
  readonly condition: "new" | "excellent" | "good" | "fair";
  readonly totalUnits: number;
  readonly rating: RatingSummary;
  readonly publishedAt: string;
  readonly media: readonly Media[];
}

export interface WebSpecialisation {
  readonly id: string;
  readonly name: LocalizedText;
}

export interface WebCoachPackage {
  readonly id: string;
  readonly name: LocalizedText;
  readonly durationMinutes: number;
  readonly sessionCount: number;
  readonly mode: "in-person" | "online";
  readonly price: Money;
  readonly compareAtPrice?: Money;
}

export interface WebCoach {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly headline: LocalizedText;
  readonly sportIds: readonly string[];
  readonly specializations: readonly string[];
  readonly certifications: readonly {
    readonly id: string;
    readonly name: string;
    readonly issuedBy: string;
    readonly issuedAt?: string;
    readonly expiresAt?: string;
  }[];
  readonly yearsOfExperience: number;
  readonly languages: readonly string[];
  readonly location: WebLocation;
  readonly isRemoteAvailable: boolean;
  readonly sessionRate?: Money;
  readonly packages: readonly WebCoachPackage[];
  readonly completedSessions: number;
  readonly responseTimeHours: number;
  readonly rating: RatingSummary;
  readonly publishedAt: string;
  readonly avatar?: MediaImage;
  readonly gallery: readonly Media[];
}

export interface WebCourse {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly format: "online" | "in-person" | "hybrid";
  readonly level: "beginner" | "intermediate" | "advanced";
  readonly durationHours: number;
  readonly price: Money;
  readonly compareAt?: Money;
  readonly instructorIds: readonly string[];
  readonly moduleCount: number;
  readonly certification?: { readonly name: LocalizedText; readonly issuedBy: LocalizedText };
  readonly languages: readonly string[];
  readonly venue?: LocalizedText;
  /**
   * The next cohort, held RELATIVE TO TODAY exactly as the storefront generates
   * it — an absolute date would make the catalogue look abandoned a fortnight
   * after the snapshot was taken.
   */
  readonly intake: { readonly startsInDays: number; readonly seatsTotal: number };
  readonly rating: RatingSummary;
  readonly status: "draft" | "published" | "archived";
  readonly publishedDaysAgo: number;
  readonly media: readonly Media[];
}

export interface WebArticle {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly excerpt: LocalizedText;
  readonly body: LocalizedText;
  readonly authorId: string;
  readonly categoryIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly readingMinutes: number;
  readonly status: "draft" | "published" | "archived";
  readonly publishedAt: string;
  readonly coverImage?: MediaImage;
}

export interface WebAuthor {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly bio?: LocalizedText;
  readonly avatar?: MediaImage;
}

export interface WebTopic {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
}

export interface WebPost {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: string;
  readonly kind: "discussion" | "question" | "announcement";
  readonly topicIds: readonly string[];
  readonly sportIds: readonly string[];
  readonly authorName: string;
  readonly createdAt: string;
  readonly likeCount: number;
}

export interface WebComment {
  readonly id: string;
  readonly postId: string;
  readonly parentId: string | null;
  readonly authorName: string;
  readonly body: string;
  readonly createdAt: string;
  readonly likeCount: number;
}

export interface WebReview {
  readonly id: string;
  readonly targetType: "product" | "rental-item" | "coach" | "course";
  readonly targetId: string;
  readonly authorName: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title?: string;
  readonly body: string;
  readonly createdAt: string;
  readonly isVerified?: boolean;
  readonly helpfulCount: number;
}

/** The storefront theme contract, verbatim — the settings domain owns the shape. */
export type WebTheme = Omit<StorefrontTheme, "audit">;

/* ---------------------------------------------------------------- careers */

/*
 * The careers marketplace's seed, as the storefront stores it. Unlike the
 * catalogue these are the storefront's RAW records (the dev bridge mirrors the
 * same shapes live), and their dates are absolute as of `takenAt` — the
 * admin's fixtures move them forward by the days since (`mocks/careers`).
 */
export interface WebEmployer {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly kind: EmployerKind;
  readonly cityId: JobCity;
  readonly about: string;
  readonly website?: string;
  readonly size?: EmployerSize;
  readonly email: string;
  readonly phone?: string;
  readonly contactName: string;
  readonly logo?: MediaImage;
  readonly verificationStatus: EmployerVerificationStatus;
  readonly verificationNote?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WebJobCategory {
  readonly id: string;
  readonly slug: string;
  readonly name: LocalizedText;
}

export interface WebJob {
  readonly id: string;
  readonly slug: string;
  readonly reference: string;
  readonly employerId: string;
  readonly title: string;
  readonly categoryId: string;
  readonly sportIds: readonly string[];
  readonly cityId: JobCity;
  readonly workMode: WorkMode;
  readonly employmentType: EmploymentType;
  readonly experienceLevel: ExperienceLevel;
  readonly salary?: SalaryRange;
  readonly showSalary: boolean;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly benefits: readonly string[];
  readonly languages: readonly JobLanguage[];
  readonly positions: number;
  readonly closesOn?: string;
  readonly status: JobStatus;
  readonly moderationNote?: string;
  readonly featured: boolean;
  readonly postedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * An application with its CV's METADATA ONLY — never the bytes, which stay on
 * the storefront — and without the employer's private note.
 */
export interface WebJobApplication {
  readonly id: string;
  readonly reference: string;
  readonly jobId: string;
  readonly employerId: string;
  readonly customerId: string;
  readonly candidate: { readonly name: string; readonly email: string; readonly phone?: string };
  readonly cv: CvFile;
  readonly coverLetter: string;
  readonly yearsExperience: number;
  readonly certifications?: string;
  readonly availableFrom?: string;
  readonly expectedSalary?: Money;
  readonly status: ApplicationStatus;
  readonly statusNote?: string;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly history: readonly StatusStep[];
  readonly seenByEmployerAt?: string;
}

export interface WebCareers {
  /** The main city of each governorate, in both languages — what careers search matches. */
  readonly cities: Readonly<Record<JobCity, LocalizedText>>;
  readonly employers: readonly WebEmployer[];
  readonly jobCategories: readonly WebJobCategory[];
  readonly jobs: readonly WebJob[];
  readonly jobApplications: readonly WebJobApplication[];
}

export interface WebsiteSnapshot {
  readonly takenAt: string;
  readonly sports: readonly WebSport[];
  readonly brands: readonly WebBrand[];
  readonly productCategories: readonly WebCategory[];
  readonly products: readonly WebProduct[];
  readonly rentalLocations: readonly WebLocation[];
  readonly rentalCategories: readonly WebCategory[];
  readonly rentalItems: readonly WebRentalItem[];
  readonly specialisations: readonly WebSpecialisation[];
  readonly coaches: readonly WebCoach[];
  readonly courseCategories: readonly WebCategory[];
  readonly courses: readonly WebCourse[];
  readonly authors: readonly WebAuthor[];
  readonly articleCategories: readonly WebCategory[];
  readonly articles: readonly WebArticle[];
  readonly topics: readonly WebTopic[];
  readonly posts: readonly WebPost[];
  readonly comments: readonly WebComment[];
  readonly reviews: readonly WebReview[];
  readonly theme: WebTheme;
  readonly careers: WebCareers;
}
