import type { MediaImage } from "@/types";

import type { MediaService } from "./media.contract";
import { assertImageFile } from "./media.validate";

/** The longest edge an uploaded image is kept at. The API stores derivatives; the mock keeps one. */
const MAX_EDGE = 1600;

/**
 * Uploads without a server: the image is decoded, scaled down to at most
 * 1600px on its longest edge and re-encoded as WebP (JPEG where the browser
 * cannot write WebP), then returned as a `data:` URL.
 *
 * A data URL is self-contained, which is the point: it survives the dev bridge
 * to the storefront, where `next/image` renders it as-is, and it needs nothing
 * to be running. It is also why the image is scaled first — a 6 MB phone photo
 * inlined into every record would make the mock store crawl.
 */
async function encode(file: File): Promise<{ url: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw images.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = canvas.toDataURL("image/webp", 0.85);
  /* A browser that cannot encode WebP silently hands back a PNG instead. */
  const url = webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.85);
  return { url, width, height };
}

export const mockMediaService: MediaService = {
  async uploadImage(file, options) {
    assertImageFile(file);
    const { url, width, height } = await encode(file);
    /* A beat of latency, so the uploading state is seen as it will be in production. */
    await new Promise((resolve) => setTimeout(resolve, 350));
    options.signal?.throwIfAborted();
    const image: MediaImage = {
      kind: "image",
      id: `media-${crypto.randomUUID()}`,
      url,
      alt: options.alt ?? "",
      width,
      height,
    };
    return image;
  },

  /** Nothing is actually stored keyed by id in this mock, so there is nothing to remove — a beat of
      latency stands in for the request, same as every other mock call. */
  async deleteImage() {
    await new Promise((resolve) => setTimeout(resolve, 150));
  },
};
