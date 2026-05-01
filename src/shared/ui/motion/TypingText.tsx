// Ported from Animate UI (https://animate-ui.com/) "Typing Text" effect.
// Upstream: animate-ui/registry/text/typing (manual port, Nov 2026).
// Scope: motion-only per docs/adr/0002-animate-ui-motion-only.md.
// Honors prefers-reduced-motion via an SSR-safe static fallback.

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

type TypingTextProps = {
  /** The text(s) to type. An array enables looping between entries. */
  text: string | readonly string[];
  /** Per-character typing speed in ms. */
  typingSpeedMs?: number;
  /** Per-character deleting speed in ms (only when looping across entries). */
  deletingSpeedMs?: number;
  /** Pause in ms after typing an entry completes. */
  pauseMs?: number;
  /** Show a blinking caret. */
  showCursor?: boolean;
  /** Optional className on the output element. */
  className?: string;
};

/**
 * Incrementally types and (optionally) deletes text. When reduced motion is
 * requested, renders the first entry immediately as plain text.
 *
 * Emits an `aria-live="off"` node by default — callers add live-region
 * semantics themselves if a screen-reader announcement is desired. A
 * static fallback copy is exposed via `aria-label` so the full value is
 * always visible to assistive tech regardless of typing progress.
 */
export function TypingText({
  text,
  typingSpeedMs = 60,
  deletingSpeedMs = 30,
  pauseMs = 1500,
  showCursor = true,
  className,
}: TypingTextProps) {
  const entries: readonly string[] = useMemo(
    () => (Array.isArray(text) ? (text as readonly string[]) : [text as string]),
    [text],
  );
  const fullLabel = entries.join(" / ");
  const isLooping = entries.length > 1;
  const reduced = useReducedMotion();

  const [entryIndex, setEntryIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const reducedSettledRef = useRef(false);

  useEffect(() => {
    if (!reduced || reducedSettledRef.current) return;
    reducedSettledRef.current = true;
    setDisplay(entries[0] ?? "");
  }, [reduced, entries]);

  useEffect(() => {
    if (reduced) return;
    const current: string = entries[entryIndex] ?? "";

    if (phase === "typing") {
      if (display === current) {
        if (!isLooping) return;
        const pauseTimer = window.setTimeout(() => setPhase("pausing"), pauseMs);
        return () => window.clearTimeout(pauseTimer);
      }
      const next = current.slice(0, display.length + 1);
      const typeTimer = window.setTimeout(() => setDisplay(next), typingSpeedMs);
      return () => window.clearTimeout(typeTimer);
    }

    if (phase === "pausing") {
      const deleteTimer = window.setTimeout(() => setPhase("deleting"), pauseMs);
      return () => window.clearTimeout(deleteTimer);
    }

    if (display.length === 0) {
      const advanceTimer = window.setTimeout(() => {
        setEntryIndex((index) => (index + 1) % entries.length);
        setPhase("typing");
      }, 0);
      return () => window.clearTimeout(advanceTimer);
    }
    const next = display.slice(0, display.length - 1);
    const deleteCharTimer = window.setTimeout(() => setDisplay(next), deletingSpeedMs);
    return () => window.clearTimeout(deleteCharTimer);
  }, [
    display,
    entryIndex,
    entries,
    isLooping,
    phase,
    reduced,
    typingSpeedMs,
    deletingSpeedMs,
    pauseMs,
  ]);

  return (
    <span className={className} aria-label={fullLabel} aria-live="off">
      <span aria-hidden="true">{display}</span>
      {showCursor && !reduced ? (
        <span aria-hidden="true" className="typing-text-caret">
          {"\u2588"}
        </span>
      ) : null}
    </span>
  );
}
