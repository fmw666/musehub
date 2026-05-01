// Inspired by Animate UI (https://animate-ui.com/) "Press Pulse" / ripple
// style feedback effects. Manual port, Nov 2026.
// Scope: motion-only per docs/adr/0002-animate-ui-motion-only.md.
// Honors prefers-reduced-motion by rendering no overlay in that mode.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type PressPulseProps = {
  /** Children wrapped by the pulse overlay. Must accept position: relative ancestor. */
  children: ReactNode;
  /**
   * When this value changes, a one-shot pulse is played on top of the
   * children. Pass a boolean, counter, or any stable value that flips
   * when a press/action succeeds (e.g. a `copied` flag).
   */
  triggerKey: unknown;
  /** className applied to the relative wrapper. */
  className?: string;
  /** className applied to the pulse overlay element. Callers own its appearance. */
  overlayClassName?: string;
  /** Target scale at the apex of the pulse. */
  scale?: number;
  /** Total duration of the pulse in seconds. */
  duration?: number;
};

/**
 * Wraps its children in a relatively-positioned container and plays a one-shot
 * scale+opacity pulse overlay each time `triggerKey` changes.
 *
 * Layout rules:
 *   - The wrapper does not change its children's size or flow.
 *   - The overlay is absolutely positioned and pointer-events: none; it never
 *     intercepts input.
 *
 * Accessibility:
 *   - The overlay is aria-hidden. It is a purely visual effect.
 *   - Under reduced motion, no overlay is rendered at all.
 */
export function PressPulse({
  children,
  triggerKey,
  className,
  overlayClassName,
  scale = 1.08,
  duration = 0.5,
}: PressPulseProps) {
  const reduced = useReducedMotion();
  const [pulseId, setPulseId] = useState(0);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // Skip the first mount so the pulse only plays on actual changes.
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    setPulseId((id) => id + 1);
  }, [triggerKey]);

  return (
    <span className={className} style={{ position: "relative", display: "inline-flex" }}>
      {children}
      {!reduced ? (
        <AnimatePresence>
          {pulseId > 0 ? (
            <motion.span
              key={pulseId}
              aria-hidden="true"
              className={overlayClassName}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                borderRadius: "inherit",
              }}
              initial={{ opacity: 0.55, scale: 1 }}
              animate={{ opacity: 0, scale }}
              exit={{ opacity: 0 }}
              transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : null}
        </AnimatePresence>
      ) : null}
    </span>
  );
}
