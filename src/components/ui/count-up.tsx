import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/reveal";

/**
 * A figure that counts up to its value once, when it first appears.
 *
 * Motion drives it, but the engine is imported inside the effect rather than
 * at the top of the file: this component sits in the UI kit, and a static
 * import here would put the full engine back into the first download for every
 * screen (see `app/motion-provider.tsx`). By the time a dashboard figure is on
 * screen the engine is usually already loaded, and if it is not, the figure
 * waits at zero for a frame.
 *
 * Only a change of `value` replays it. `format` is read through a ref, because
 * it is almost always an inline arrow, and a new function on every render would
 * otherwise restart the count each time anything on the screen changed.
 *
 * Under `prefers-reduced-motion` the final value is simply there.
 */
export function CountUp({
  value,
  format,
  duration = 1.1,
}: {
  value: number;
  format: (value: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const formatRef = useRef(format);
  useLayoutEffect(() => {
    formatRef.current = format;
  });
  const [still] = useState(prefersReducedMotion);

  useEffect(() => {
    const element = ref.current;
    if (!element || still) return;
    let cancelled = false;
    let stop: (() => void) | undefined;

    void import("motion").then(({ animate }) => {
      if (cancelled) return;
      const controls = animate(0, value, {
        duration,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          element.textContent = formatRef.current(Math.round(latest));
        },
      });
      stop = () => controls.stop();
    });

    return () => {
      cancelled = true;
      stop?.();
      element.textContent = formatRef.current(value);
    };
  }, [value, duration, still]);

  return <span ref={ref}>{format(still ? value : 0)}</span>;
}
