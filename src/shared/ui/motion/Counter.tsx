// Ported from Animate UI (https://animate-ui.com/) "Counter" / "Number Ticker"
// effect. Upstream: animate-ui/registry/effects/counter (manual port, Nov 2026).
// Scope: motion-only per docs/adr/0002-animate-ui-motion-only.md.
// Honors prefers-reduced-motion via an SSR-safe static fallback.

import { animate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { motion } from "motion/react";
import { useEffect } from "react";

type CounterProps = {
  /** Target value. The counter animates from its previous value to this one. */
  value: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Optional className on the rendered span. */
  className?: string;
  /** aria-label override; defaults to the numeric value. */
  "aria-label"?: string;
  /**
   * If true, the counter's internal motion value starts at 0 on mount so the
   * first render tweens from 0 up to `value`. Default is false, which matches
   * the historical behavior of snapping to `value` on mount and animating only
   * on subsequent value changes. Reduced-motion users see `value` immediately
   * regardless of this flag.
   */
  startFromZero?: boolean;
};

/**
 * Numeric roll atom: displays an integer that animates smoothly when `value`
 * changes. Intended to replace only the numeric `<span>` inside an existing
 * HeroUI layout (e.g. a filter summary); it must not absorb surrounding
 * layout or controls.
 */
export function Counter({
  value,
  duration = 0.8,
  className,
  "aria-label": ariaLabel,
  startFromZero = false,
}: CounterProps) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(startFromZero && !reduced ? 0 : value);
  const rounded = useTransform(mv, (latest: number) => Math.round(latest).toString());

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, duration, reduced, mv]);

  return (
    <motion.span className={className} aria-label={ariaLabel ?? String(value)} aria-live="polite">
      {rounded}
    </motion.span>
  );
}
