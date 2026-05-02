/*
 * Atelier Ink rail glyph set.
 *
 * The four navigation icons + the user `Atelier Mark` (rendered separately
 * in RailUserMenu) share one visual grammar:
 *
 *   1. A shell — a slightly broken / hand-drawn outer outline.
 *   2. A stroke — one expressive interior brushstroke.
 *   3. An accent — a small "ink seal" dot that lights up to honey
 *      (--muse-color-honey) when its rail item is hovered or active.
 *   4. The whole mark sits inside a `g.rail-glyph-mark` rotated -5°,
 *      so each icon reads as a small stamp pressed into the rail. The
 *      tilt straightens on hover/active for a "picked up" feedback.
 *
 * All shared color / stroke / hover behavior lives in `side-rail.css`
 * under the `.rail-glyph-*` selectors so the user mark and the
 * navigation marks stay byte-for-byte consistent.
 */

import type { SVGProps } from "react";

export type RailGlyphName = "compose" | "compass" | "folder" | "bookmark";

type RailGlyphProps = {
  name: RailGlyphName;
};

const baseSvgProps: SVGProps<SVGSVGElement> = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  className: "rail-glyph",
  "aria-hidden": true,
};

export function RailGlyph({ name }: RailGlyphProps) {
  return (
    <svg {...baseSvgProps}>
      <g className="rail-glyph-mark">{glyphContent(name)}</g>
    </svg>
  );
}

function glyphContent(name: RailGlyphName) {
  switch (name) {
    case "compass":
      // Open compass disc (gap at 5 o'clock so it reads hand-drawn) + an
      // asymmetric willow-leaf needle pointing NE, with the pivot pin as
      // the honey ink seal at the center.
      return (
        <>
          <path className="rail-glyph-shell" d="M6.4 18.4A8 8 0 1 1 14 20" />
          <path className="rail-glyph-stroke" d="m15.2 8.6-2.4 4-4.6 2 2.4-4z" />
          <circle className="rail-glyph-accent" cx="12" cy="12" r="1.15" />
        </>
      );
    case "compose":
      // Tilted painter's panel (open L-shaped outline) crossed by a single
      // calligraphic stroke. The seal dot rides on the brush tip so the
      // glyph reads as "the moment ink hits the canvas".
      return (
        <>
          <path className="rail-glyph-shell" d="M5.4 7.6v9a2 2 0 0 0 2 2H17" />
          <path className="rail-glyph-stroke" d="M18.6 5.6 11.4 12.8l-1.6 4 4-1.6 7.2-7.2z" />
          <circle className="rail-glyph-accent" cx="19.2" cy="5.4" r="1.15" />
        </>
      );
    case "bookmark":
      // Folded-corner ribbon. The shell traces an open ribbon with a
      // notched tail; one fold-line crosses the body; the seal sits at
      // the heart of the ribbon as the chosen mark.
      return (
        <>
          <path className="rail-glyph-shell" d="M7.2 4.4h9.6V20l-4.8-2.8L7.2 20Z" />
          <path className="rail-glyph-stroke" d="M9.6 9.4h4.8" />
          <circle className="rail-glyph-accent" cx="14.6" cy="12.4" r="1.15" />
        </>
      );
    case "folder":
      // Two offset cards — a back card peeking out behind a front card.
      // The back tab is the only place the honey seal lives, so the icon
      // reads as "your stack of work, one corner signed".
      return (
        <>
          <path
            className="rail-glyph-shell"
            d="M3.4 17V7.4a1.6 1.6 0 0 1 1.6-1.6h4.4l1.6 2h7.4a1.6 1.6 0 0 1 1.6 1.6V17a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2Z"
          />
          <path className="rail-glyph-stroke" d="M6.4 19.4h11.2" />
          <circle className="rail-glyph-accent" cx="19.4" cy="6.6" r="1.15" />
        </>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
