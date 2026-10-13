import { cn } from "cn";

/**
 * The sports the platform actually covers, drawn as line art and drifting
 * slowly behind the mark.
 *
 * The list is not decoration picked for shape: it is the same taxonomy the
 * storefront and the admin run on — football, basketball, tennis, swimming,
 * running, cycling and the weights room. Someone signing in sees what the
 * platform is for before they see a single screen of it.
 *
 * Each glyph is a stroked path inheriting `currentColor`, so one opacity class
 * on the container sets the whole field in both themes. They are `aria-hidden`
 * and carry no labels — a screen reader announcing seven sport names on the
 * sign-in screen would be reading out wallpaper.
 *
 * Positions, sizes and timings are written by hand rather than generated.
 * Random values would differ between renders and make the field jump on every
 * state change, and a hand-placed spread looks less even — which is what keeps
 * it from reading as a grid.
 */
const GLYPHS = [
  {
    sport: "football",
    d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 7l4.5 3.3-1.7 5.3h-5.6L7.5 10.3zM12 2v5M20.5 9.2l-4 1.1M18.3 18.6l-3.5-3M5.7 18.6l3.5-3M3.5 9.2l4 1.1",
    style: { insetInlineStart: "12%", top: "16%" },
    size: "size-16",
    duration: "26s",
    delay: "0s",
  },
  {
    sport: "basketball",
    d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2c3.5 2.6 5.2 6 5.2 10S15.5 19.4 12 22M12 2C8.5 4.6 6.8 8 6.8 12s1.7 7.4 5.2 10",
    style: { insetInlineEnd: "14%", top: "24%" },
    size: "size-12",
    duration: "34s",
    delay: "3s",
  },
  {
    sport: "tennis",
    d: "M9 3.5a5.5 6.5 0 1 0 0 13 5.5 6.5 0 0 0 0-13M9 16.5 15.5 21M4.6 6.6l8.8 7.3M13.4 6.6l-8.8 7.3",
    style: { insetInlineStart: "22%", bottom: "26%" },
    size: "size-14",
    duration: "30s",
    delay: "6s",
  },
  {
    sport: "swimming",
    d: "M2 17c2-1.6 3.3-1.6 5.3 0s3.4 1.6 5.4 0 3.3-1.6 5.3 0 1.9 1 2 .6M2 21c2-1.6 3.3-1.6 5.3 0s3.4 1.6 5.4 0 3.3-1.6 5.3 0M6.5 12.5 11 9l4 2.6M17.5 5.5a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2M12.5 9.2l4-3.2 2.5 3.4",
    style: { insetInlineEnd: "20%", bottom: "32%" },
    size: "size-16",
    duration: "28s",
    delay: "1.5s",
  },
  {
    sport: "running",
    d: "M13.5 4.7a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4M8 22l2.5-5.5 3-2.3-1-4.7-3.5 2L7 14M14.5 9.5 18 12l3-.5M10 7.5 14.5 6l2.5 2.5",
    style: { insetInlineStart: "44%", top: "9%" },
    size: "size-12",
    duration: "38s",
    delay: "8s",
  },
  {
    sport: "cycling",
    d: "M5.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M18.5 21a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M5.5 17.5h6L15 9l3.5 8.5M9 9h5M16.5 5.6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3",
    style: { insetInlineStart: "8%", bottom: "12%" },
    size: "size-14",
    duration: "32s",
    delay: "11s",
  },
  {
    sport: "gym",
    d: "M4 9v6M2 11v2M20 9v6M22 11v2M7 7v10M17 7v10M7 12h10",
    style: { insetInlineEnd: "10%", top: "56%" },
    size: "size-16",
    duration: "24s",
    delay: "4.5s",
  },
] as const;

export function SportGlyphs({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 text-foreground/[0.13]", className)}
    >
      {GLYPHS.map((glyph) => (
        <svg
          key={glyph.sport}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`sport-glyph absolute ${glyph.size}`}
          style={{
            ...glyph.style,
            animationDuration: glyph.duration,
            animationDelay: glyph.delay,
          }}
        >
          <path d={glyph.d} />
        </svg>
      ))}
    </div>
  );
}
