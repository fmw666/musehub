import { type CSSProperties, type ReactNode, useEffect } from "react";

type DissolveTransitionProps = {
  children: ReactNode;
  className?: string;
  durationMs: number;
  isActive: boolean;
  onExited: () => void;
};

type DissolveTransitionStyle = CSSProperties & {
  "--dissolve-duration": string;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  "matchMedia" in window &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function DissolveTransition({
  children,
  className,
  durationMs,
  isActive,
  onExited,
}: DissolveTransitionProps) {
  const transitionDurationMs = Math.max(0, durationMs);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timeoutId = window.setTimeout(
      onExited,
      prefersReducedMotion() ? 0 : transitionDurationMs,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isActive, onExited, transitionDurationMs]);

  if (!isActive) {
    return null;
  }

  const style = {
    "--dissolve-duration": `${transitionDurationMs}ms`,
  } satisfies DissolveTransitionStyle;

  return (
    <div
      className={["dissolve-transition-layer", className].filter(Boolean).join(" ")}
      data-transition-state="exiting"
      style={style}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
