import type { ReactNode } from "react";

/**
 * Where each kind of record lives in the admin.
 *
 * Cross-references are the point of the linked fixtures — a review opens its
 * product, a booking opens its customer — so the paths are written once here
 * rather than as string templates scattered through twenty screens.
 */
export const recordPath = {
  customer: (id: string) => `/customers/${id}`,
  order: (id: string) => `/orders/${id}`,
  product: (id: string) => `/catalogue/products/${id}`,
  coach: (id: string) => `/coaches/${id}`,
  coachBooking: (id: string) => `/coaches/bookings/${id}`,
  course: (id: string) => `/education/courses/${id}`,
  /** The item's own edit page. */
  rentalItem: (id: string) => `/rental/items/${id}`,
  /** An item's bookings — what staff act on day to day, so links from a booking go here. */
  rentalItemBookings: (id: string) => `/rental/bookings?item=${id}`,
  rentalBooking: (reference: string) => `/rental/bookings?q=${reference}`,
  communityPost: (id: string) => `/community/${id}`,
  /* Careers — the hrefs of the storefront's staff notifications land on these. */
  job: (id: string) => `/careers/jobs/${id}`,
  employer: (id: string) => `/careers/employers/${id}`,
  jobApplication: (id: string) => `/careers/applications/${id}`,
} as const;

/** Where a review's subject lives. */
export function reviewTargetPath(type: string, id: string): string {
  switch (type) {
    case "product":
      return recordPath.product(id);
    case "coach":
      return recordPath.coach(id);
    case "course":
      return recordPath.course(id);
    default:
      return recordPath.rentalItemBookings(id);
  }
}

/** "—" for an absent value, so an empty cell is visibly empty rather than missing. */
export function orDash(value: ReactNode | undefined | null): ReactNode {
  return value === undefined || value === null || value === "" ? "—" : value;
}
