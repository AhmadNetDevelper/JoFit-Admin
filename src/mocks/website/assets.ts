import type { Media, MediaImage } from "@/types";

/*
 * The storefront's fixture photos are paths on the storefront itself —
 * `/images/coaches/coach-layla.jpg` — which the admin, on another origin,
 * would ask its own server for and get nothing. These make them absolute.
 *
 * VITE_STOREFRONT_ASSETS_URL exists for the mock API, where the admin's
 * mocks run inside Node and VITE_STOREFRONT_URL points at the in-process
 * bridge rather than at a server a browser can reach.
 *
 * An uploaded image (a `data:` URL, or an absolute URL from the API) is left
 * as it is. Deleted with the rest of `src/mocks`.
 */
const base = (
  import.meta.env.VITE_STOREFRONT_ASSETS_URL ??
  import.meta.env.VITE_STOREFRONT_URL ??
  "http://localhost:3001"
).replace(/\/+$/, "");

const absolute = (url: string) => (url.startsWith("/") && !url.startsWith("//") ? `${base}${url}` : url);

export function storefrontImage(image: MediaImage | undefined): MediaImage | undefined {
  return image ? { ...image, url: absolute(image.url) } : undefined;
}

export function storefrontMedia(list: readonly Media[] | undefined): readonly Media[] {
  return (list ?? []).map((entry) =>
    entry.kind === "image"
      ? { ...entry, url: absolute(entry.url) }
      : { ...entry, url: absolute(entry.url), posterUrl: entry.posterUrl ? absolute(entry.posterUrl) : undefined },
  );
}
