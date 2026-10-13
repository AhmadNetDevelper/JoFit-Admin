import type {
  AdminCoach,
  CoachBooking,
  CoachBookingStatus,
  CoachSpecialisation,
} from "@/features/coaches";
import type { AuditInfo, Location } from "@/types";

import { mockPeople } from "../people";
import { atTime, hashSeed, seededRandom } from "../runtime";
import { storefrontImage, storefrontMedia } from "../website/assets";
import { websiteSnapshot } from "../website/snapshot";

/**
 * Coaches: the ten the storefront lists, plus the applicants it does not.
 *
 * A listed coach is `approved` by definition — the site only shows approved
 * profiles — so the website's ten arrive approved, with their packages, rates
 * and copy exactly as the public sees them. The two `pending` applicants below
 * exist only here: that is what a verification queue holds, and approving one
 * is the decision that would put them on the site.
 *
 * (The earlier fixtures had Rania Suleiman pending verification while the site
 * was already selling her sessions. Deriving from one source removes that.)
 */
const audit = (createdAt: string, updatedAt: string): AuditInfo => ({
  createdAt,
  createdBy: "system",
  updatedAt,
  updatedBy: "admin-2",
});

/* Stored without `coachCount`: the service counts coaches on every read, so a
   profile edit can never leave the number stale. Copied so staff can add and
   remove entries without touching the generated snapshot. */
export const mockSpecialisations: Omit<CoachSpecialisation, "coachCount">[] = websiteSnapshot.specialisations.map(
  (entry) => ({ id: entry.id, name: entry.name }),
);

const firstName = (name: string) => name.split(" ")[0]!.toLowerCase();

const listed: AdminCoach[] = websiteSnapshot.coaches.map((coach) => ({
  id: coach.id,
  slug: coach.slug,
  name: coach.name,
  email: `${firstName(coach.name.en)}@coaches.jofit.test`,
  headline: coach.headline,
  /* The storefront's own photos, made absolute so the admin can show them. */
  avatar: storefrontImage(coach.avatar),
  gallery: storefrontMedia(coach.gallery),
  sportIds: coach.sportIds,
  specializations: coach.specializations,
  /* The storefront prints certificates in English only; the Arabic is left
     blank rather than copied, and only the year is kept, as the live API does. */
  certifications: coach.certifications.map((certification) => ({
    id: certification.id,
    name: { en: certification.name, ar: "" },
    issuedBy: { en: certification.issuedBy, ar: "" },
    year: certification.issuedAt ? Number(certification.issuedAt.slice(0, 4)) : undefined,
    // One claim in five is still waiting on its document — listed, but flagged.
    isVerified: hashSeed(certification.id) % 5 !== 0,
  })),
  yearsOfExperience: coach.yearsOfExperience,
  languages: coach.languages,
  location: coach.location,
  isRemoteAvailable: coach.isRemoteAvailable,
  sessionRate: coach.sessionRate,
  packages: coach.packages,
  completedSessions: coach.completedSessions,
  responseTimeHours: coach.responseTimeHours,
  rating: coach.rating,
  verificationStatus: "approved",
  audit: audit(coach.publishedAt, coach.publishedAt),
}));

/* Venues as the coach profiles name them — the storefront's coach and rental
   fixtures do not agree on every depot name, so each domain uses its own. */
const venue = (id: string): Location => listed.find((coach) => coach.location.id === id)!.location;

/** Every venue a listed coach works from — what a profile's location is chosen from. */
export const mockCoachLocations: readonly Location[] = [
  ...new Map(listed.map((coach) => [coach.location.id, coach.location])).values(),
];
const amman = venue("loc-amman");
const irbid = venue("loc-irbid");
const jod = (amount: number) => ({ amount, currency: "JOD" as const });

const applicants: AdminCoach[] = [
  {
    id: "coach-marwan",
    slug: "marwan-haddad",
    name: { en: "Marwan Haddad", ar: "مروان حداد" },
    email: "marwan@coaches.jofit.test",
    headline: { en: "Swim technique for adult beginners", ar: "تقنيات السباحة للمبتدئين البالغين" },
    // No photos yet: the list shows the empty thumbnail, the profile an empty drop zone.
    gallery: [],
    sportIds: ["sport-swimming"],
    specializations: ["spec-technique"],
    certifications: [],
    yearsOfExperience: 3,
    languages: ["ar", "en"],
    location: amman,
    isRemoteAvailable: false,
    sessionRate: jod(20_000),
    packages: [
      {
        id: "pkg-single",
        name: { en: "Single session", ar: "جلسة واحدة" },
        durationMinutes: 45,
        sessionCount: 1,
        mode: "in-person",
        price: jod(20_000),
      },
    ],
    completedSessions: 0,
    responseTimeHours: 24,
    rating: { average: 0, count: 0 },
    verificationStatus: "pending",
    audit: audit("2026-09-14", "2026-09-14"),
  },
  {
    id: "coach-reem",
    slug: "reem-alawneh",
    name: { en: "Reem Alawneh", ar: "ريم علاونة" },
    email: "reem@coaches.jofit.test",
    headline: { en: "Pilates and mobility for desk workers", ar: "بيلاتس ومرونة لأصحاب الأعمال المكتبية" },
    gallery: [],
    sportIds: ["sport-fitness"],
    specializations: ["spec-mobility"],
    certifications: [
      {
        id: "cert-reem-1",
        name: { en: "Mat Pilates Instructor", ar: "" },
        issuedBy: { en: "Balanced Body", ar: "" },
        year: 2023,
        isVerified: false,
      },
    ],
    yearsOfExperience: 5,
    languages: ["ar", "en"],
    location: irbid,
    isRemoteAvailable: true,
    sessionRate: jod(24_000),
    packages: [
      {
        id: "pkg-single",
        name: { en: "Single session", ar: "جلسة واحدة" },
        durationMinutes: 60,
        sessionCount: 1,
        mode: "in-person",
        price: jod(24_000),
      },
      {
        id: "pkg-online",
        name: { en: "Online review", ar: "مراجعة عن بُعد" },
        durationMinutes: 45,
        sessionCount: 1,
        mode: "online",
        price: jod(15_000),
      },
    ],
    completedSessions: 0,
    responseTimeHours: 12,
    rating: { average: 0, count: 0 },
    verificationStatus: "pending",
    audit: audit("2026-09-18", "2026-09-18"),
  },
];

export const mockCoaches: AdminCoach[] = [...listed, ...applicants];

/* ------------------------------------------------------------ bookings */

/*
 * What athletes write in the booking step's "goal" box. Customer-written, so
 * it stays in whatever language it was typed in and is rendered `dir="auto"`.
 */
const GOALS = [
  "Build strength for the new season without aggravating my knee.",
  "Get my 10K under 50 minutes by spring.",
  "My son (14) wants to make the school team — shooting form mostly.",
  "أريد تحسين لياقتي العامة بعد انقطاع طويل",
  "Coming back from an ACL reconstruction, cleared by physio.",
  "تحضير لسباق نصف ماراثون البحر الميت",
  "Form check on squat and deadlift, online is fine.",
  "أحتاج برنامج قوة مناسب لكرة القدم",
  undefined,
  undefined,
];

const CANCEL_NOTES = [
  "Customer asked to cancel — travelling that week.",
  "Coach unavailable; customer offered another slot and declined.",
  "ألغى العميل بسبب الإصابة",
];

function statusFor(startsIn: number, roll: number): CoachBookingStatus {
  if (startsIn < 0) return roll > 0.88 ? "cancelled" : "completed";
  if (roll > 0.93) return "cancelled";
  return startsIn <= 2 || roll > 0.35 ? "confirmed" : "pending";
}

function generateBookings(count: number): CoachBooking[] {
  const random = seededRandom(20260923);
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
  const bookings: CoachBooking[] = [];

  for (let index = 0; index < count; index += 1) {
    const coach = pick(listed);
    const pkg = pick(coach.packages);
    const customer = pick(mockPeople);
    /* From two months back to three weeks ahead. */
    const startsIn = Math.round(-62 + (index / count) * 83 + random() * 4);
    const hour = 7 + Math.floor(random() * 12);
    const startsAt = atTime(startsIn, hour, random() > 0.5 ? 30 : 0);
    const endsAt = new Date(Date.parse(startsAt) + pkg.durationMinutes * 60_000)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
    const status = statusFor(startsIn, random());
    /* Booked before it starts, and never later than today. */
    const bookedIn = Math.min(0, startsIn - 1 - Math.floor(random() * 9));
    const bookedAt = atTime(bookedIn, 8 + Math.floor(random() * 12), 15);
    /* A quarter of sessions are bought for someone else — a child, a teammate. */
    const forSomeoneElse = random() > 0.75;

    bookings.push({
      id: `cb-${index + 1}`,
      reference: `CB-${(5100 + index).toString()}`,
      coachId: coach.id,
      coachName: coach.name,
      packageId: pkg.id,
      packageName: pkg.name,
      mode: pkg.mode,
      sessionCount: pkg.sessionCount,
      startsAt,
      endsAt,
      total: pkg.price,
      customerId: customer.id,
      contact: {
        name: forSomeoneElse ? `${customer.name.split(" ")[0]} (for family)` : customer.name,
        email: customer.email,
        phone: customer.phone ?? "+962790000000",
      },
      goal: pick(GOALS),
      status,
      statusNote: status === "cancelled" ? pick(CANCEL_NOTES) : undefined,
      audit: { createdAt: bookedAt, createdBy: "system", updatedAt: bookedAt, updatedBy: "system" },
    });
  }

  return bookings;
}

export const mockCoachBookings: CoachBooking[] = generateBookings(46);
