import type { Media, MediaImage } from "@/types";

/*
 * THE RULES FOR A PICTURE SAVED ON A RECORD — one copy for every domain.
 *
 * The file was checked when it was uploaded (`services/media`); what reaches a
 * record's save is the `MediaImage` the upload answered. So these check that
 * object — an uploaded image with an address the storefront can load — and
 * never the file. They are the rules the API enforces (docs/BACKEND-BRIEF.md
 * §7.12), which is why every mock service calls these rather than its own.
 *
 * Messages are English, like every service's.
 */

export const MAX_GALLERY_ITEMS = 12;
export const MAX_ALT_LENGTH = 300;

/* The media host (https), plain http in development, or a data URL from the mock uploader. */
const IMAGE_URL = /^(?:https?:\/\/|data:image\/)/;
const VIDEO_URL = /^https?:\/\//;

/** Why `value` cannot be saved as a picture, or undefined. `null` and `undefined` mean "no picture". */
export function imageProblem(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object") return "This is not an uploaded image. Upload it again.";
  const image = value as Partial<Record<keyof MediaImage, unknown>>;
  if (image.kind !== "image") return "This is not an uploaded image. Upload it again.";
  if (typeof image.id !== "string" || image.id.trim() === "") return "The image has no id. Upload it again.";
  if (typeof image.url !== "string" || !IMAGE_URL.test(image.url)) {
    return "The image address must start with https://, http:// or data:image/.";
  }
  if (image.alt !== undefined && typeof image.alt !== "string") return "The alt text must be text.";
  if (typeof image.alt === "string" && image.alt.trim().length > MAX_ALT_LENGTH) {
    return `The alt text is at most ${MAX_ALT_LENGTH} characters.`;
  }
  return undefined;
}

/** A video already in a gallery: the admin does not upload them, but keeps them. */
function videoProblem(value: Partial<Record<string, unknown>>): string | undefined {
  if (typeof value.id !== "string" || value.id.trim() === "") return "The video has no id. Remove it and add it again.";
  if (typeof value.url !== "string" || !VIDEO_URL.test(value.url)) {
    return "The video address must start with https:// or http://.";
  }
  return undefined;
}

/**
 * Why `value` cannot be saved as a gallery, or undefined: the first thing
 * wrong, with the entry named by its position as staff see it ("Image 2: …").
 * `null` and `undefined` mean "no gallery".
 */
export function galleryProblem(value: unknown, max = MAX_GALLERY_ITEMS): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return "Send the images as a list.";
  if (value.length > max) return `A gallery holds at most ${max} images. Remove ${value.length - max} to save.`;
  const seen = new Set<string>();
  for (const [index, item] of value.entries()) {
    const entry = (item && typeof item === "object" ? item : {}) as Partial<Record<string, unknown>>;
    const problem = entry.kind === "video" ? videoProblem(entry) : imageProblem(item ?? {});
    if (problem) return `Image ${index + 1}: ${problem}`;
    const id = String(entry.id).trim();
    if (seen.has(id)) return `Image ${index + 1}: this image is already in the gallery.`;
    seen.add(id);
  }
  return undefined;
}

const size = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;

/** What is stored of a picture that passed `imageProblem`: its own fields, alt text trimmed. */
export function storedImage(image: MediaImage): MediaImage {
  const width = size(image.width);
  const height = size(image.height);
  return {
    kind: "image",
    id: image.id.trim(),
    url: image.url,
    alt: typeof image.alt === "string" ? image.alt.trim() : "",
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

/** What is stored of a gallery that passed `galleryProblem`, in the order sent. */
export function storedGallery(media: readonly Media[]): Media[] {
  return media.map((entry) =>
    entry.kind === "image"
      ? storedImage(entry)
      : {
          kind: "video",
          id: entry.id.trim(),
          url: entry.url,
          ...(typeof entry.posterUrl === "string" && entry.posterUrl ? { posterUrl: entry.posterUrl } : {}),
        },
  );
}
