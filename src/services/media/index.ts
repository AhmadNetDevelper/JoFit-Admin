import { resolveService } from "../resolve-service";

import type { MediaService } from "./media.contract";
import { httpMediaService } from "./media.http";
import { mockMediaService } from "./media.mock";

/**
 * Image uploads. Shared infrastructure rather than a domain: products, coaches,
 * articles and the rest all upload the same way, so the upload fields in
 * `components/form` call this directly.
 */
export const mediaService = resolveService<MediaService>("media", {
  mock: mockMediaService,
  http: httpMediaService,
});

export {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  type MediaPurpose,
  type MediaService,
  type UploadImageOptions,
} from "./media.contract";
export { imageFileProblem, type ImageFileProblem } from "./media.validate";
