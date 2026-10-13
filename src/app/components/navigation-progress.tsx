import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { useNavigation } from "react-router-dom";

import { useTranslation } from "@/i18n";

/** Most screens arrive sooner than this; a bar that flashes for a frame reads as a glitch. */
const SHOW_AFTER_MS = 150;

/**
 * A thin bar along the bottom edge of the top bar while the next screen downloads.
 *
 * Screens load on demand (`lazy-screen.ts`) and the router keeps the current
 * one on view until the next has arrived, so on a slow connection a click could
 * look ignored. The bar says it was heard: it runs quickly, then slows and never
 * reaches the end on its own; when the screen is there it fills and fades.
 */
export function NavigationProgress() {
  const { t, direction } = useTranslation();
  const reducedMotion = useReducedMotion();
  const loading = useNavigation().state === "loading";
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setWaited(true), SHOW_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      setWaited(false);
    };
  }, [loading]);

  return (
    <div className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
      <AnimatePresence>
        {loading && waited && (
          <m.div
            key="bar"
            role="progressbar"
            aria-label={t("state.loading")}
            className="h-full bg-primary"
            /* Grows from where the reader starts: the left in English, the right in Arabic. */
            style={{ transformOrigin: direction === "rtl" ? "right" : "left" }}
            initial={reducedMotion ? { opacity: 0 } : { scaleX: 0 }}
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { scaleX: 0.85, transition: { duration: 6, ease: [0.1, 0.8, 0.2, 1] } }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : {
                    scaleX: 1,
                    opacity: 0,
                    transition: { scaleX: { duration: 0.15 }, opacity: { delay: 0.15, duration: 0.2 } },
                  }
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
