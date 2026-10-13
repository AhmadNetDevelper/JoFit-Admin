import { storefrontImage } from "../website/assets";
import { websiteSnapshot } from "../website/snapshot";
import type { WebEmployer, WebJob, WebJobApplication, WebJobCategory } from "../website/types";

/**
 * THE CAREERS MARKETPLACE, AS THE ADMIN STARTS.
 *
 * The storefront's own seed (`website/src/mocks/careers`), generated into the
 * snapshot by `scripts/sync-website-mocks.cjs` — the same employers, jobs and
 * applications the careers board is built from, so a job staff approve here
 * is the job a candidate applies for there.
 *
 * With the storefront's dev server running, the dev bridge replaces the
 * contents of these arrays with the storefront's live store
 * (`mocks/bridge.ts`), and every decision staff make is pushed back to it.
 * Without it, the admin works on these on its own.
 *
 * The records keep the storefront's raw shapes; `careers.mock.ts` builds the
 * admin's views from them (counts, what is public) at read time, so a
 * re-read of the store never leaves a count stale.
 *
 * Every employer is FICTIONAL demonstration data. CVs are metadata only: the
 * bytes stay on the storefront. Deleted with the rest of `src/mocks`.
 */

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4}-\d{2}-\d{2})(.*)$/;

function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * The seed's dates are absolute as of the day the snapshot was taken; moved
 * forward by the days since, "submitted yesterday" stays yesterday — the same
 * rule the storefront's store follows.
 */
function shiftDates<T>(value: T, days: number): T {
  if (days === 0) return value;
  if (typeof value === "string") {
    const match = ISO_DATE.exec(value);
    if (!match) return value;
    const shifted = new Date(Date.parse(match[1]!) + days * MS_PER_DAY).toISOString().slice(0, 10);
    return `${shifted}${match[2]}` as T;
  }
  if (Array.isArray(value)) return value.map((entry) => shiftDates(entry, days)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, shiftDates(entry, days)])) as T;
  }
  return value;
}

const days = Math.round((todayUtc() - Date.parse(websiteSnapshot.takenAt)) / MS_PER_DAY);
const seed = shiftDates(websiteSnapshot.careers, days);

/** An employer's logo is a storefront path until it is uploaded; make it one the admin can load. */
export function withAbsoluteLogo(employer: WebEmployer): WebEmployer {
  const logo = storefrontImage(employer.logo);
  return logo ? { ...employer, logo } : employer;
}

/** City names in both languages, so a search in either finds "Irbid" / "إربد". */
export const mockJobCityNames = websiteSnapshot.careers.cities;

export const mockEmployers: WebEmployer[] = seed.employers.map(withAbsoluteLogo);
export const mockJobCategories: WebJobCategory[] = seed.jobCategories.map((category) => ({ ...category }));
export const mockJobs: WebJob[] = seed.jobs.map((job) => ({ ...job }));
export const mockJobApplications: WebJobApplication[] = seed.jobApplications.map((entry) => ({ ...entry }));
