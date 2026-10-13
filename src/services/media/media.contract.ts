import type { MediaImage } from "@/types";

/**
 * What an image is for. The API stores it with the file so it can size the
 * derivatives (a brand logo is small and square; a product photo is large) and
 * so an orphaned upload can be traced back to the screen it came from.
 */
export type MediaPurpose =
  | "product"
  | "product-category"
  | "brand-logo"
  | "sport"
  | "rental-item"
  | "coach-avatar"
  | "coach-gallery"
  | "course"
  | "article-cover"
  | "author-avatar";

export interface UploadImageOptions {
  readonly purpose: MediaPurpose;
  /** Screen-reader text. Can also be edited after the upload. */
  readonly alt?: string;
  readonly signal?: AbortSignal;
}

/** The file types an upload accepts, as the file picker and the API both check them. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** 10 MB — a phone photo at full resolution fits; a raw camera file does not. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Uploading images for records. The upload is its own request: the file goes
 * up first and comes back as a `MediaImage` (id, public URL, size), and the
 * record's form then saves that object in its image field like any other value.
 * Nothing about a record's save changes because it has pictures.
 */
export interface MediaService {
  uploadImage(file: File, options: UploadImageOptions): Promise<MediaImage>;
  /**
   * `DELETE /v1/admin/media/{id}` — removes an uploaded image the way the
   * upload returned it (by its `MediaImage.id`). No screen calls this yet
   * (nothing in the admin currently offers "delete this image" on its own,
   * only "replace it" as part of a record's save), but the capability exists
   * so a future cleanup screen or a record's own delete flow can call it.
   */
  deleteImage(id: string): Promise<void>;
}
