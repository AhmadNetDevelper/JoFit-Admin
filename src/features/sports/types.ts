import type { LocalizedText, MediaImage } from "@/types";

export type SportId = string;

/**
 * The taxonomy every other domain references. The admin manages it; the
 * storefront only reads it.
 */
export interface Sport {
  readonly id: SportId;
  readonly slug: string;
  readonly name: LocalizedText;
  readonly isFeatured: boolean;
  /**
   * The sport's picture (16:9, a photograph). Optional: the storefront's
   * `Sport` carries it for the sports index and "shop by sport" tiles.
   * Uploaded through `mediaService` with purpose "sport", then saved here.
   */
  readonly image?: MediaImage;
  /**
   * The short introduction the storefront shows under the sport's name
   * (`SportDto`/`SportDraftRequest.description`, nullable live). Optional: a
   * sport saved without one has none.
   */
  readonly description?: LocalizedText;
}

/** The editable part of a sport. */
export type SportDraft = Omit<Sport, "id">;
