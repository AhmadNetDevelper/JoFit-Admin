import type { MediaImage } from "@/types";

import { httpClient } from "../http";
import type { MediaService } from "./media.contract";
import { assertImageFile } from "./media.validate";

/** What the upload answers — `MediaImageDto2`: `kind` may be null and the size comes as `null` when unknown. */
interface MediaImageDto {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly kind?: string | null;
}

function toMediaImage(dto: MediaImageDto): MediaImage {
  return {
    kind: "image",
    id: dto.id,
    url: dto.url,
    alt: dto.alt,
    ...(dto.width != null ? { width: dto.width } : {}),
    ...(dto.height != null ? { height: dto.height } : {}),
  };
}

/**
 * `POST /v1/admin/media` as multipart/form-data: `file`, `purpose`, `alt`.
 * The API answers 201 with the stored image — its id, its public URL and its
 * pixel size — which the form then saves on the record.
 */
export const httpMediaService: MediaService = {
  async uploadImage(file, options) {
    assertImageFile(file);
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("purpose", options.purpose);
    if (options.alt) form.append("alt", options.alt);
    const dto = await httpClient.post<MediaImageDto>("/v1/admin/media", form, {
      signal: options.signal,
      /* A large photo on a slow connection needs longer than a JSON call. */
      timeoutMs: 120_000,
      auth: true,
    });
    return toMediaImage(dto);
  },
  /** `DELETE /v1/admin/media/{id}`. The API answers 204; nothing to return. */
  async deleteImage(id) {
    await httpClient.delete<void>(`/v1/admin/media/${encodeURIComponent(id)}`, { auth: true });
  },
};
