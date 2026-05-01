// Inspired by Animate UI (https://animate-ui.com/) "Motion Highlight" effect.
// Upstream pattern: shared layout / layoutId-style sliding indicator.
// This implementation is a measurement-driven variant: callers supply the
// target rect (relative to a positioned ancestor) and the highlight slides
// to it with a motion spring. Keeps React Aria button children untouched.
// Scope: motion-only per docs/adr/0002-animate-ui-motion-only.md.

import { motion, useReducedMotion } from "motion/react";

export type HighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MotionHighlightProps = {
  /** Target position (in pixels, relative to the positioned ancestor). */
  rect: HighlightRect | null;
  /** className applied to the sliding element; callers own its appearance. */
  className?: string;
  /** Optional spring overrides. */
  stiffness?: number;
  damping?: number;
};

/**
 * Renders a single absolutely-positioned element that smoothly slides to
 * follow a caller-supplied rect. When `rect` is null the element fades out
 * and stops responding to transitions.
 *
 * The caller owns:
 *   - the positioned ancestor (must be position: relative / absolute / etc.)
 *   - the rect measurement (via ref + getBoundingClientRect)
 *   - the visual style of the highlight (via className)
 */
export function MotionHighlight({
  rect,
  className,
  stiffness = 420,
  damping = 38,
}: MotionHighlightProps) {
  const reduced = useReducedMotion();

  if (!rect) {
    return null;
  }

  return (
    <motion.div
      className={className}
      aria-hidden="true"
      initial={false}
      animate={{
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        opacity: 1,
      }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness, damping, mass: 0.6 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    />
  );
}
