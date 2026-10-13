/*
 * Motion's animation engine, in a file of its own so it downloads after the
 * first paint instead of with it. `MotionProvider` imports this lazily; see
 * `motion-provider.tsx`.
 */
import { domAnimation } from "motion/react";

export default domAnimation;
