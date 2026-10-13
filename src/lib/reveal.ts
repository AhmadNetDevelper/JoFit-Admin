import { animate } from "motion/mini";

/**
 * A SURFACE ARRIVING: the blocks inside `container` rise into place in reading
 * order, once, and then stay still.
 *
 * This is the admin's one kind of entrance. The shell plays it when a screen
 * opens and again when that screen's data lands, so every screen arrives the
 * same way and nothing moves after it has. Controls never animate on their own
 * — a form someone fills in ten times a day has to sit still.
 *
 * WHICH BLOCKS. Anything marked `data-reveal` inside the container, in document
 * order; if nothing is marked, the container's direct children. A screen marks
 * its cards when it wants them to cascade one by one rather than as one block.
 *
 * WHY `motion/mini`. It is Motion's WAAPI-only `animate`, about 2KB, where the
 * full engine is ~40KB gzipped. The browser runs the animation off the main
 * thread; `fill: "both"` holds the first frame through each item's delay, so a
 * block waiting its turn is hidden rather than flashing in and then animating.
 * When it finishes, Motion writes the final values inline, and this removes
 * them — an inline `transform` left behind would override the element's own
 * transform classes for as long as it is on screen.
 *
 * Nothing happens under `prefers-reduced-motion`: the content is simply there.
 */
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/*
 * AN ENTRANCE MUST NEVER TAKE THE SCREEN DOWN WITH IT.
 *
 * WAAPI's `commitStyles()` throws on an element that is not rendered, and
 * Motion calls it. On a phone the rail is `display: none` (it becomes a sheet),
 * so animating it threw inside a layout effect, React Router's error boundary
 * caught it, and the whole admin rendered as a blank page below `md`. So: an
 * element with no boxes is skipped, and anything else the browser objects to
 * is swallowed — the worst an entrance may do is not play.
 */
function isRendered(element: Element): boolean {
  return element.getClientRects().length > 0;
}

function play(element: HTMLElement, keyframes: Parameters<typeof animate>[1], options: Parameters<typeof animate>[2]) {
  if (!isRendered(element)) return;
  try {
    void animate(element, keyframes, options).then(
      () => {
        element.style.removeProperty("opacity");
        element.style.removeProperty("transform");
      },
      () => undefined,
    );
  } catch {
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
  }
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export interface RevealOptions {
  /** How far each block rises, in px. */
  readonly distance?: number;
  /** Seconds between one block and the next. */
  readonly step?: number;
  readonly duration?: number;
  /** Seconds before the first block starts. */
  readonly delay?: number;
  /** Past this many, the rest appear with the last one rather than queueing. */
  readonly max?: number;
  /** Direct children only, ignoring `data-reveal` further down. */
  readonly direct?: boolean;
  /** Children matching this are left alone: they animate themselves. */
  readonly skip?: string;
}

export function reveal(
  container: Element | null,
  { distance = 14, step = 0.06, duration = 0.55, delay = 0, max = 8, direct = false, skip }: RevealOptions = {},
): void {
  if (!container || prefersReducedMotion()) return;
  const marked = direct ? [] : [...container.querySelectorAll<HTMLElement>("[data-reveal]")];
  const targets = (marked.length > 0 ? marked : ([...container.children] as HTMLElement[])).filter(
    (element) => !skip || !element.matches(skip),
  );

  targets.forEach((element, index) => {
    play(
      element,
      { opacity: [0, 1], transform: [`translateY(${distance}px)`, "translateY(0px)"] },
      { duration, delay: delay + Math.min(index, max) * step, ease: EASE_OUT_EXPO },
    );
  });
}

/**
 * The shell's side of the same idea: a whole panel sliding in from where it
 * lives — the rail from the window's outer edge, the bar from above.
 */
export function slideIn(
  element: Element | null,
  from: string,
  { duration = 0.7, delay = 0 }: { duration?: number; delay?: number } = {},
): void {
  if (!(element instanceof HTMLElement) || prefersReducedMotion()) return;
  play(element, { opacity: [0, 1], transform: [from, "translate(0px, 0px)"] }, { duration, delay, ease: EASE_OUT_EXPO });
}
