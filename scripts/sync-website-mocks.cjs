/**
 * Regenerates `src/mocks/website/snapshot.ts` from the storefront's fixtures.
 *
 *   node scripts/sync-website-mocks.cjs
 *
 * WHY THIS EXISTS
 * The admin and the storefront each had their own fixtures, and they drifted:
 * different products, different coaches, courses that existed in one app only.
 * This script makes the storefront's catalogue the single source both apps read,
 * so an id that opens a product in the admin opens the same product on the site.
 *
 * It loads `../website/src/mocks/*` through the storefront's own `jiti` (those
 * files are TypeScript with `@/` aliases), projects each record to exactly the
 * fields declared in `src/mocks/website/types.ts`, and writes a plain typed
 * module. The output is committed, so the admin builds without the website
 * being installed; re-run this after changing the storefront's fixtures.
 *
 * Deleted with `src/mocks` when the API exists — at that point both apps read
 * the same database and there is nothing to sync.
 */
const fs = require("node:fs");
const path = require("node:path");

const admin = path.resolve(__dirname, "..");
const website = path.resolve(admin, "../website");
const jiti = require(path.join(website, "node_modules/jiti"))(__filename, {
  alias: { "@": path.join(website, "src") },
});
const load = (file) => jiti(path.join(website, "src/mocks", file));

const shop = load("shop/index.ts");
const education = load("education/index.ts");
const courseDetail = load("education/course-detail.ts");
const rental = load("rental/index.ts");
const locations = load("rental/locations.ts");
const content = load("content/index.ts");
const community = load("community/index.ts");
const reviews = load("reviews/index.ts");
const sports = load("sports/index.ts");
const coaches = load("coaches/index.ts");
const careers = load("careers/index.ts");
const theme = JSON.parse(
  fs.readFileSync(path.join(website, "src/features/theme/default-theme.json"), "utf8"),
);

/* ---------------------------------------------------------------- helpers */

const LOCALES = ["en", "ar"];

/** The admin's `LocalizedText` requires every locale; fail loudly if one is absent. */
function text(value, where) {
  if (!value) throw new Error(`Missing localized text at ${where}`);
  for (const locale of LOCALES) {
    if (typeof value[locale] !== "string" || value[locale].trim() === "") {
      throw new Error(`Missing "${locale}" at ${where}`);
    }
  }
  return { en: value.en, ar: value.ar };
}

const optionalText = (value, where) => (value ? text(value, where) : undefined);
const money = (value) => (value ? { amount: value.amount, currency: value.currency } : undefined);
const rating = (value) => ({ average: value.average, count: value.count });

/* Pictures as the storefront stores them. A fixture path such as
   `/images/coaches/x.jpg` stays relative here; the admin's fixtures make it
   absolute against the storefront (see src/mocks/website/assets.ts). */
const image = (value) =>
  value && value.kind === "image"
    ? { kind: "image", id: value.id, url: value.url, alt: value.alt ?? "", width: value.width, height: value.height }
    : undefined;
const media = (list) =>
  (list ?? []).flatMap((entry) =>
    entry.kind === "image"
      ? [image(entry)]
      : entry.kind === "video"
        ? [{ kind: "video", id: entry.id, url: entry.url, posterUrl: entry.posterUrl }]
        : [],
  );

/** Drops `undefined` so the output has no `key: undefined` noise. */
function clean(record) {
  return JSON.parse(JSON.stringify(record));
}

const MS_PER_DAY = 86_400_000;
const todayUtc = () => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};

/* ------------------------------------------------------------- projection */

const snapshot = {
  takenAt: new Date(todayUtc()).toISOString().slice(0, 10),

  sports: sports.mockSports.map((sport) => ({
    id: sport.id,
    slug: sport.slug,
    name: text(sport.name, `sport ${sport.id}`),
    isFeatured: sport.isFeatured,
    image: image(sport.image),
  })),

  brands: shop.mockBrands.map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    description: optionalText(brand.description, `brand ${brand.id}`),
    logo: image(brand.logo),
  })),

  productCategories: shop.mockProductCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: text(category.name, `category ${category.id}`),
    description: optionalText(category.description, `category ${category.id}`),
    parentId: category.parentId,
    sportIds: category.sportIds,
    image: image(category.image),
  })),

  products: shop.mockProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    title: text(product.title, `product ${product.id}.title`),
    summary: text(product.summary, `product ${product.id}.summary`),
    description: text(product.description, `product ${product.id}.description`),
    brandId: product.brandId,
    categoryIds: product.categoryIds,
    sportIds: product.sportIds,
    options: product.options.map((option) => ({
      key: option.key,
      name: text(option.name, `product ${product.id} option ${option.key}`),
      values: option.values,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      title: variant.title,
      selections: variant.selections,
      price: money(variant.price.current),
      compareAt: money(variant.price.compareAt),
      stockStatus: variant.stockStatus,
    })),
    rating: rating(product.rating),
    publishedAt: product.publishedAt,
    media: media(product.media),
  })),

  rentalLocations: locations.mockRentalLocations.map((location) => ({
    id: location.id,
    name: text(location.name, `location ${location.id}`),
    city: text(location.city, `location ${location.id}.city`),
    countryCode: location.countryCode,
  })),

  rentalCategories: rental.mockRentalCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: text(category.name, `rental category ${category.id}`),
    description: optionalText(category.description, `rental category ${category.id}`),
    parentId: category.parentId,
    sportIds: category.sportIds,
  })),

  rentalItems: rental.mockRentalItems.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: text(item.title, `rental ${item.id}.title`),
    summary: text(item.summary, `rental ${item.id}.summary`),
    categoryIds: item.categoryIds,
    sportIds: item.sportIds,
    rates: item.rates.map((rate) => ({
      unit: rate.unit,
      price: money(rate.price),
      minUnits: rate.minUnits,
      maxUnits: rate.maxUnits,
    })),
    deposit: money(item.deposit),
    locationId: item.location.id,
    condition: item.condition,
    totalUnits: item.totalUnits,
    rating: rating(item.rating),
    publishedAt: item.publishedAt,
    media: media(item.media),
  })),

  specialisations: coaches.mockSpecialisations.map((entry) => ({
    id: entry.id,
    name: text(entry.name, `specialisation ${entry.id}`),
  })),

  coaches: coaches.mockCoaches.map((coach) => ({
    id: coach.id,
    slug: coach.slug,
    name: text(coach.name, `coach ${coach.id}.name`),
    headline: text(coach.headline, `coach ${coach.id}.headline`),
    sportIds: coach.sportIds,
    specializations: coach.specializations,
    certifications: coach.certifications.map((certification) => ({
      id: certification.id,
      name: certification.name,
      issuedBy: certification.issuedBy,
      issuedAt: certification.issuedAt,
      expiresAt: certification.expiresAt,
    })),
    yearsOfExperience: coach.yearsOfExperience,
    languages: coach.languages,
    location: {
      id: coach.location.id,
      name: text(coach.location.name, `coach ${coach.id}.location`),
      city: text(coach.location.city, `coach ${coach.id}.location.city`),
      countryCode: coach.location.countryCode,
    },
    isRemoteAvailable: coach.isRemoteAvailable,
    sessionRate: money(coach.sessionRate),
    packages: coach.packages.map((pkg) => ({
      id: pkg.id,
      name: text(pkg.name, `coach ${coach.id} package ${pkg.id}`),
      durationMinutes: pkg.durationMinutes,
      sessionCount: pkg.sessionCount,
      mode: pkg.mode,
      price: money(pkg.price),
      compareAtPrice: money(pkg.compareAtPrice),
    })),
    completedSessions: coach.completedSessions,
    responseTimeHours: coach.responseTimeHours,
    rating: rating(coach.rating),
    publishedAt: coach.publishedAt,
    avatar: image(coach.avatar),
    gallery: media(coach.gallery),
  })),

  courseCategories: education.mockCourseCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: text(category.name, `course category ${category.id}`),
    description: optionalText(category.description, `course category ${category.id}`),
    parentId: null,
    sportIds: [],
  })),

  courses: education.mockCourses.map((course) => {
    const intake = education.buildCourseIntake(course.id);
    const detail = courseDetail.courseDetail(course.id);
    return {
      id: course.id,
      slug: course.slug,
      title: text(course.title, `course ${course.id}.title`),
      summary: text(course.summary, `course ${course.id}.summary`),
      categoryIds: course.categoryIds,
      sportIds: course.sportIds,
      format: course.format,
      level: course.level,
      durationHours: course.durationHours,
      price: money(course.price.current),
      compareAt: money(course.price.compareAt),
      instructorIds: course.instructorIds,
      moduleCount: course.modules.length,
      certification: course.certification
        ? {
            name: text(course.certification.name, `course ${course.id}.certification`),
            issuedBy: text(course.certification.issuedBy, `course ${course.id}.issuedBy`),
          }
        : undefined,
      languages: detail.languages,
      venue: optionalText(detail.venue, `course ${course.id}.venue`),
      intake: {
        startsInDays: Math.round((Date.parse(intake.startsOn) - todayUtc()) / MS_PER_DAY),
        seatsTotal: intake.seatsTotal,
      },
      rating: rating(course.rating),
      status: course.status,
      publishedDaysAgo: course.publishedDaysAgo,
      media: media(course.media),
    };
  }),

  authors: content.mockAuthors.map((author) => ({
    id: author.id,
    slug: author.slug,
    name: author.name,
    bio: optionalText(author.bio, `author ${author.id}.bio`),
    avatar: image(author.avatar),
  })),

  articleCategories: content.mockArticleCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: text(category.name, `article category ${category.id}`),
    description: optionalText(category.description, `article category ${category.id}`),
    parentId: null,
    sportIds: [],
  })),

  articles: content.mockArticles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: text(article.title, `article ${article.id}.title`),
    excerpt: text(article.excerpt, `article ${article.id}.excerpt`),
    body: text(article.body, `article ${article.id}.body`),
    authorId: article.authorId,
    categoryIds: article.categoryIds,
    sportIds: article.sportIds,
    readingMinutes: article.readingMinutes,
    status: article.status,
    publishedAt: article.publishedAt,
    coverImage: image(article.coverImage),
  })),

  topics: community.mockCommunityTopics.map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    name: text(topic.name, `topic ${topic.id}`),
  })),

  posts: community.mockCommunityPosts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    kind: post.kind,
    topicIds: post.topicIds,
    sportIds: post.sportIds,
    authorName: post.author.displayName,
    createdAt: post.createdAt,
    likeCount: post.likeCount,
  })),

  comments: community.mockCommunityComments.map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    authorName: comment.author.displayName,
    body: comment.body,
    createdAt: comment.createdAt,
    likeCount: comment.likeCount,
  })),

  reviews: reviews.mockReviews.map((review) => ({
    id: review.id,
    targetType: review.target.type,
    targetId: review.target.id,
    authorName: review.author.displayName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    isVerified: review.isVerified,
    helpfulCount: review.helpfulCount,
  })),

  theme,

  /* The careers marketplace: the storefront's raw records, as the dev bridge
     mirrors them live. Dates are absolute as of `takenAt`; the admin's
     fixtures move them forward (src/mocks/careers). An application carries
     its CV's METADATA only — the bytes never leave the storefront — and not
     the employer's private note. */
  careers: {
    cities: Object.fromEntries(
      Object.entries(careers.cityNames).map(([id, name]) => [id, text(name, `city ${id}`)]),
    ),
    employers: careers.seedEmployers.map((employer) => ({
      id: employer.id,
      slug: employer.slug,
      name: employer.name,
      kind: employer.kind,
      cityId: employer.cityId,
      about: employer.about,
      website: employer.website,
      size: employer.size,
      email: employer.email,
      phone: employer.phone,
      contactName: employer.contactName,
      logo: image(employer.logo),
      verificationStatus: employer.verificationStatus,
      verificationNote: employer.verificationNote,
      createdAt: employer.createdAt,
      updatedAt: employer.updatedAt,
    })),
    jobCategories: careers.seedJobCategories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: text(category.name, `job category ${category.id}`),
    })),
    jobs: careers.seedJobs.map((job) => ({
      id: job.id,
      slug: job.slug,
      reference: job.reference,
      employerId: job.employerId,
      title: job.title,
      categoryId: job.categoryId,
      sportIds: job.sportIds,
      cityId: job.cityId,
      workMode: job.workMode,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      salary: job.salary
        ? { min: money(job.salary.min), max: money(job.salary.max), period: job.salary.period }
        : undefined,
      showSalary: job.showSalary,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      languages: job.languages,
      positions: job.positions,
      closesOn: job.closesOn,
      status: job.status,
      moderationNote: job.moderationNote,
      featured: job.featured,
      postedAt: job.postedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })),
    jobApplications: careers.seedJobApplications.map((entry) => {
      const file = careers.seedCvFiles.find((candidate) => candidate.id === entry.cvId);
      if (!file) throw new Error(`Application ${entry.id} has no CV ${entry.cvId}`);
      return {
        id: entry.id,
        reference: entry.reference,
        jobId: entry.jobId,
        employerId: entry.employerId,
        customerId: entry.customerId,
        candidate: entry.candidate,
        cv: { id: file.id, fileName: file.fileName, mimeType: file.mimeType, bytes: file.bytes },
        coverLetter: entry.coverLetter,
        yearsExperience: entry.yearsExperience,
        certifications: entry.certifications,
        availableFrom: entry.availableFrom,
        expectedSalary: money(entry.expectedSalary),
        status: entry.status,
        statusNote: entry.statusNote,
        submittedAt: entry.submittedAt,
        updatedAt: entry.updatedAt,
        history: entry.history,
        seenByEmployerAt: entry.seenByEmployerAt,
      };
    }),
  },
};

/* ----------------------------------------------------------------- output */

const header = `/*
 * GENERATED — do not edit by hand.
 *
 * Written by \`node scripts/sync-website-mocks.cjs\` from the storefront's
 * fixtures in ../website/src/mocks. Change the storefront's data, then re-run
 * the script. See \`./types.ts\` for why this file exists.
 */
import type { WebsiteSnapshot } from "./types";

export const websiteSnapshot: WebsiteSnapshot = `;

const target = path.join(admin, "src/mocks/website/snapshot.ts");
fs.writeFileSync(target, `${header}${JSON.stringify(clean(snapshot), null, 2)};\n`);

const counts = [...Object.entries(snapshot), ...Object.entries(snapshot.careers)]
  .filter(([, value]) => Array.isArray(value))
  .map(([key, value]) => `${key}=${value.length}`)
  .join(" ");
console.log(`Wrote ${path.relative(admin, target)}: ${counts}`);
