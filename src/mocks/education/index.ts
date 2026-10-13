import type {
  AdminCourse,
  CourseCategory,
  Enrolment,
  EnrolmentStatus,
} from "@/features/education";
import type { AuditInfo } from "@/types";

import { mockPeople } from "../people";
import { atTime, daysFromToday, hashSeed, seededRandom } from "../runtime";
import { storefrontMedia } from "../website/assets";
import { websiteSnapshot } from "../website/snapshot";

/**
 * The academy: the storefront's nine courses, their cohorts, and the people on
 * them.
 *
 * SEATS ARE COUNTED, NOT TYPED. The storefront shows each course's next intake
 * as open / closing / full, computed from a seat count. Here that count is the
 * number of pending and active enrolments on the cohort, so confirming or
 * cancelling one moves the signal — the education service recomputes it on
 * every read.
 *
 * The next cohort is seeded to match the storefront exactly: the same hash of
 * the course id decides how many seats the site says are taken, and that many
 * enrolments are generated for it. A previous cohort per course, three months
 * back, gives completed enrolments and real revenue history.
 */
const audit = (createdAt: string, updatedAt: string): AuditInfo => ({
  createdAt,
  createdBy: "admin-2",
  updatedAt,
  updatedBy: "admin-2",
});

/* Stored without `courseCount`: the service counts the courses filed under each
   category on every read, so adding, moving or deleting a course moves it. */
export const mockCourseCategories: Omit<CourseCategory, "courseCount">[] = websiteSnapshot.courseCategories.map(
  (category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
  }),
);

const listedCourses: AdminCourse[] = websiteSnapshot.courses.map((course) => {
  const publishedAt = daysFromToday(-course.publishedDaysAgo);
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    /* The storefront's own pictures, made absolute so the admin can show them. */
    media: storefrontMedia(course.media),
    format: course.format,
    level: course.level,
    durationHours: course.durationHours,
    price: course.price,
    compareAtPrice: course.compareAt,
    categoryIds: course.categoryIds,
    sportIds: course.sportIds,
    instructorIds: course.instructorIds,
    moduleCount: course.moduleCount,
    certification: course.certification,
    languages: course.languages,
    venue: course.venue,
    // Seats and state are filled in by the service from the enrolments below.
    nextIntake: {
      startsOn: daysFromToday(course.intake.startsInDays),
      seatsTotal: course.intake.seatsTotal,
      seatsTaken: 0,
      state: "open",
    },
    enrolmentCount: 0,
    rating: course.rating,
    status: course.status,
    audit: audit(publishedAt, publishedAt),
  };
});

/* A course still being written. Not on the site, which is why it is a draft. */
const draftCourse: AdminCourse = {
  id: "course-cpd-kettlebell",
  slug: "kettlebell-coaching",
  title: { en: "Kettlebell Coaching (CPD)", ar: "تدريب الكيتلبل (تطوير مهني)" },
  summary: {
    en: "Teaching the swing, clean and press safely to groups.",
    ar: "",
  },
  media: [],
  format: "in-person",
  level: "intermediate",
  durationHours: 12,
  price: { amount: 110_000, currency: "JOD" },
  categoryIds: ["ccat-cpd"],
  sportIds: ["sport-fitness", "sport-gym"],
  instructorIds: ["coach-karim"],
  moduleCount: 3,
  languages: ["ar"],
  venue: { en: "JoFit Academy, Amman", ar: "أكاديمية جوفِت، عمّان" },
  nextIntake: { startsOn: daysFromToday(75), seatsTotal: 12, seatsTaken: 0, state: "upcoming" },
  enrolmentCount: 0,
  rating: { average: 0, count: 0 },
  status: "draft",
  audit: audit(daysFromToday(-12), daysFromToday(-2)),
};

export const mockCourses: AdminCourse[] = [...listedCourses, draftCourse];

/* ---------------------------------------------------------- enrolments */

const CANCEL_NOTES = [
  "Moved abroad before the cohort started; refunded in full.",
  "Payment did not clear within seven days.",
  "طلب التحويل إلى الدفعة القادمة",
];

function generateEnrolments(): Enrolment[] {
  const random = seededRandom(20260924);
  const enrolments: Enrolment[] = [];
  let sequence = 3300;

  function add(course: AdminCourse, cohortStartsOn: string, cohortIn: number, customerIds: readonly string[], statusFor: (index: number) => EnrolmentStatus) {
    customerIds.forEach((customerId, index) => {
      const person = mockPeople.find((entry) => entry.id === customerId)!;
      const status = statusFor(index);
      /* Places are taken before the cohort starts, and never later than today. */
      const enrolledIn = Math.min(-(index % 5), cohortIn - 5 - Math.floor(random() * 40));
      const enrolledAt = atTime(enrolledIn, 9 + Math.floor(random() * 10), 20);
      sequence += 1;
      enrolments.push({
        id: `enr-${sequence}`,
        reference: `EN-${sequence}`,
        courseId: course.id,
        courseTitle: course.title,
        customerId: person.id,
        customerName: person.name,
        customerEmail: person.email,
        cohortStartsOn,
        status,
        progressPercent:
          status === "completed" ? 100 : status === "active" && cohortIn < 0 ? 20 + Math.floor(random() * 70) : 0,
        enrolledAt,
        // A pending seat has not been paid for yet.
        amountPaid: status === "pending" ? { amount: 0, currency: "JOD" } : course.price,
        statusNote: status === "cancelled" ? CANCEL_NOTES[Math.floor(random() * CANCEL_NOTES.length)] : undefined,
        audit: { createdAt: enrolledAt, createdBy: "system", updatedAt: enrolledAt, updatedBy: "system" },
      });
    });
  }

  /** Distinct customers for one cohort, in a stable shuffled order. */
  function cohortOf(courseId: string, size: number, salt: number): string[] {
    return [...mockPeople]
      .map((person) => ({ id: person.id, key: hashSeed(`${courseId}:${salt}:${person.id}`) }))
      .sort((a, b) => a.key - b.key)
      .slice(0, size)
      .map((entry) => entry.id);
  }

  for (const course of listedCourses) {
    const startsIn = websiteSnapshot.courses.find((entry) => entry.id === course.id)!.intake.startsInDays;
    const { seatsTotal } = course.nextIntake;

    /* Next cohort: exactly as many live seats as the storefront says are taken. */
    const taken = hashSeed(course.id) % (seatsTotal + 1);
    add(course, course.nextIntake.startsOn, startsIn, cohortOf(course.id, taken, 1), (index) =>
      index % 3 === 2 ? "pending" : "active",
    );

    /* Last cohort, three months back: mostly finished, a few dropped out. */
    const previousIn = startsIn - 91;
    const previousSize = 3 + (hashSeed(`${course.id}:prev`) % 5);
    add(course, daysFromToday(previousIn), previousIn, cohortOf(course.id, previousSize, 2), (index) =>
      index === 1 ? "cancelled" : previousIn + course.durationHours / 4 < 0 ? "completed" : "active",
    );
  }

  return enrolments;
}

export const mockEnrolments: Enrolment[] = generateEnrolments();
