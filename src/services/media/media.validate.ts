import { AppError } from "@/lib";

import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./media.contract";

export type ImageFileProblem = "type" | "size";

/** Why a picked file cannot be uploaded, before any byte is sent — or undefined. */
export function imageFileProblem(file: File): ImageFileProblem | undefined {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > MAX_IMAGE_BYTES) return "size";
  return undefined;
}

/** The same rule the API applies, for the mock adapter to refuse with. */
export function assertImageFile(file: File): void {
  const problem = imageFileProblem(file);
  if (problem === "type") {
    throw new AppError("validation", "Upload a JPEG, PNG, WebP or AVIF image.", {
      fieldErrors: { file: "Upload a JPEG, PNG, WebP or AVIF image." },
    });
  }
  if (problem === "size") {
    throw new AppError("validation", "The image is larger than 10 MB.", {
      fieldErrors: { file: "The image is larger than 10 MB." },
    });
  }
}
