import { cn } from "cn";
import { ImageOff } from "lucide-react";

import type { MediaImage } from "@/types";

/**
 * A record's picture in a list row — 40px, rounded, bordered — or a quiet
 * placeholder when it has none, so a column of thumbnails stays aligned and a
 * missing image is noticed rather than leaving a gap.
 */
export function TableThumbnail({
  image,
  fit = "cover",
  className,
}: {
  image: MediaImage | undefined;
  /** `contain` for logos. */
  fit?: "cover" | "contain";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 align-middle",
        className,
      )}
    >
      {image ? (
        <img
          src={image.url}
          alt={image.alt}
          loading="lazy"
          className={cn("size-full", fit === "contain" ? "object-contain p-1" : "object-cover")}
        />
      ) : (
        <ImageOff className="size-4 text-muted-foreground/60" aria-hidden="true" />
      )}
    </span>
  );
}
