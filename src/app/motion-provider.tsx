import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("./motion-features").then((module) => module.default);

/**
 * MOTION, LOADED LAZILY.
 *
 * `motion.div` carries Motion's whole engine with it — 123KB of the first
 * download, before the sign-in page could paint. Under `LazyMotion` the
 * components are `m.div` (from "motion/react-m"), a few KB, and the engine
 * arrives in its own file a moment later; an `m` element renders its `initial`
 * state until it does, which is exactly what an entrance wants anyway.
 *
 * `strict` makes a stray `motion.div` throw in development, because one of them
 * anywhere puts the whole engine back into the first download and nothing
 * else would say so.
 *
 * `reducedMotion="user"` turns transforms off for anyone whose system asks for
 * less motion; opacity still fades, so an entrance becomes a gentle appearance
 * rather than a jump.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
