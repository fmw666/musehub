// Ported from Animate UI (https://animate-ui.com/) "Blur Fade" effect.
// Upstream: animate-ui/registry/effects/blur-fade  (manual port, Nov 2026).
// Scope: motion-only per docs/adr/0002-animate-ui-motion-only.md.
// Honors prefers-reduced-motion via an SSR-safe static fallback.

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type BlurFadeProps = {
  children: ReactNode;
  /** Optional className applied to the wrapper element. */
  className?: string;
  /** Stagger delay in seconds before the entrance begins. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Vertical offset (px) the element animates from. */
  offsetY?: number;
  /** Blur radius (px) the element animates from. */
  blur?: number;
};

/**
 * Entrance atom: elements fade in, slide up a few pixels, and sharpen from a
 * soft blur. Used as a decorative wrapper around HeroUI content. Must not
 * replace HeroUI primitives.
 */
export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.6,
  offsetY = 8,
  blur = 6,
}: BlurFadeProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offsetY, filter: `blur(${blur}px)` }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
