import type { ListQuery, Location, Paginated } from "@/types";

import type {
  AdminCoach,
  CoachBooking,
  CoachBookingListQuery,
  CoachBookingStatus,
  CoachDraft,
  CoachListQuery,
  CoachSpecialisation,
  CoachSpecialisationDraft,
  CoachStatusDecision,
} from "../types";

export interface CoachesAdminService {
  /** Searched by either name, the headline, the slug or the email; sorted by name when no sort is given. */
  listCoaches(query?: CoachListQuery): Promise<Paginated<AdminCoach>>;
  getCoach(id: string): Promise<AdminCoach | null>;
  /**
   * 422 with field errors. A new coach starts `pending` — creating is not approving.
   * The avatar and the gallery are uploaded first (`mediaService`) and saved here
   * as values; each must be an uploaded image, and the gallery holds at most 12.
   */
  createCoach(draft: CoachDraft): Promise<AdminCoach>;
  /**
   * Replaces the profile only; verification, certifications and ratings are
   * untouched. No `avatar` (or `null`) clears it, as with every optional field.
   */
  updateCoach(id: string, draft: CoachDraft): Promise<AdminCoach>;
  /** 409 while the coach has pending or confirmed sessions, or teaches a course. */
  deleteCoach(id: string): Promise<void>;
  decideVerification(decision: CoachStatusDecision): Promise<AdminCoach>;
  setCertificationVerified(
    coachId: string,
    certificationId: string,
    isVerified: boolean,
  ): Promise<AdminCoach>;
  /** The venues a coach can be based at. */
  listLocations(): Promise<readonly Location[]>;

  /** Every specialisation, for the profile form's checkboxes (`/options`). */
  listSpecialisations(): Promise<readonly CoachSpecialisation[]>;
  /** One page for the specialisations screen; searched by either name or the id, sorted by name. */
  listSpecialisationsPage(query: ListQuery): Promise<Paginated<CoachSpecialisation>>;
  /** 422 when either name is missing or another specialisation has it. */
  createSpecialisation(draft: CoachSpecialisationDraft): Promise<CoachSpecialisation>;
  updateSpecialisation(id: string, draft: CoachSpecialisationDraft): Promise<CoachSpecialisation>;
  /** 409 while any coach lists it. */
  deleteSpecialisation(id: string): Promise<void>;

  /** `coachId` narrows to one coach — the coach's own page reads its sessions this way. */
  listBookings(query?: CoachBookingListQuery): Promise<Paginated<CoachBooking>>;
  getBooking(id: string): Promise<CoachBooking | null>;
  /** Rejects transitions the booking graph does not allow; cancelling needs a note. */
  setBookingStatus(id: string, status: CoachBookingStatus, note?: string): Promise<CoachBooking>;
}
