import { galleryProblem, imageProblem, MAX_GALLERY_ITEMS } from "@/lib";
import type { Media, MediaImage } from "@/types";

/**
 * Pictures on a coach or a course, as the API reads and checks them.
 *
 * The file itself was uploaded first (`POST /v1/admin/media`); what arrives in
 * a record's save is the `MediaImage` that upload answered. So the checks here
 * are about that object — is it an uploaded image with an address — and never
 * about the file.
 *
 * Read field by field, like the rest of a posted draft: a body can come from
 * any HTTP client through the mock API. `null`, or no value at all, is "no
 * picture"; a gallery that is not a list is an empty one.
 *
 * The checks are the shared ones (`@/lib` media-rules) — the rules the API
 * enforces, the same for every record that has pictures.
 */


const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const size = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;

/** One posted picture, or undefined for none. A wrong `kind` is kept so the check can name it. */
export function readImage(value: unknown): MediaImage | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = (typeof value === "object" ? value : {}) as Record<string, unknown>;
  const width = size(raw.width);
  const height = size(raw.height);
  return {
    kind: raw.kind as "image",
    id: str(raw.id),
    url: str(raw.url),
    alt: typeof raw.alt === "string" ? raw.alt.trim() : "",
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

/** A posted gallery, in display order. Videos already on the record are kept as they are. */
export function readGallery(value: unknown): Media[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry): Media => {
    const raw = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    if (raw.kind === "video") {
      const posterUrl = str(raw.posterUrl);
      return { kind: "video", id: str(raw.id), url: str(raw.url), ...(posterUrl ? { posterUrl } : {}) };
    }
    return readImage(raw)!;
  });
}

/**
 * Adds an error on `key` for a picture that cannot be saved — or for a
 * missing one, when the storefront needs it.
 */
export function checkImage(
  errors: Record<string, string>,
  key: string,
  image: MediaImage | undefined,
  { required = false }: { required?: boolean } = {},
): void {
  if (!image) {
    if (required) errors[key] = "Add a picture.";
    return;
  }
  const problem = imageProblem(image);
  if (problem) errors[key] = problem;
}

/** Adds one error on `key` for the first thing wrong with a gallery. */
export function checkGallery(
  errors: Record<string, string>,
  key: string,
  gallery: readonly Media[],
  { max = MAX_GALLERY_ITEMS }: { max?: number } = {},
): void {
  const problem = galleryProblem(gallery, max);
  if (problem) errors[key] = problem;
}
