/*
 * Atelier Ink rail glyph set.
 *
 * Design language: pure linework. No fills, no dots, no decorations —
 * each icon is composed of strokes only, with one calligraphic flourish
 * carrying the "art". The four navigation icons + the user medallion
 * (rendered separately in RailUserMenu) all share this grammar:
 *
 *   .rail-glyph-shell  — the recognizable structural line(s); the
 *                        outline that names the icon (a circle, a
 *                        sheet of paper, a ribbon, a folder).
 *   .rail-glyph-stroke — one expressive line played against the
 *                        shell — a needle, a brushstroke, a fold,
 *                        a horizon. This is the line that lights up
 *                        to honey on hover / active.
 *
 * The marks sit upright (no rotation). Stroke weights are uniform so
 * the rail reads as one cohesive line drawing. All shared color and
 * motion behavior live in side-rail.css under the `.rail-glyph-*`
 * selectors.
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
      // A clean disc with a slim diamond needle inscribed inside —
      // four straight lines drawn as one continuous stroke. The
      // diamond itself is the calligraphic flourish that lights up.
      return (
        <>
          <circle className="rail-glyph-shell" cx="12" cy="12" r="8.2" />
          <path className="rail-glyph-stroke" d="M12 5 13.4 12 12 19 10.6 12 Z" />
        </>
      );
    case "compose":
      // A page corner (two L-strokes — the right edge + the dog-eared
      // fold) crossed by a single long diagonal brushstroke that runs
      // off the page to the upper-right. The brushstroke is the art.
      return (
        <>
          <path className="rail-glyph-shell" d="M5.6 18.4V5.6a1.4 1.4 0 0 1 1.4-1.4h7" />
          <path className="rail-glyph-shell" d="M14 4v3.4a1.4 1.4 0 0 0 1.4 1.4h3.4" />
          <path
            className="rail-glyph-shell"
            d="M18.4 9v9.4a1.4 1.4 0 0 1-1.4 1.4H7a1.4 1.4 0 0 1-1.4-1.4"
          />
          <path className="rail-glyph-stroke" d="M8.4 16.6c2-1.4 5-4.4 9.6-9.4" />
        </>
      );
    case "bookmark":
      // A single continuous ribbon line — sides + a crisp V-notch at
      // the bottom. One slim horizontal title-line crosses the top
      // third as the calligraphic counterpoint.
      return (
        <>
          <path
            className="rail-glyph-shell"
            d="M7.4 4.6a1 1 0 0 1 1-1h7.2a1 1 0 0 1 1 1V20l-4.6-3-4.6 3Z"
          />
          <path className="rail-glyph-stroke" d="M9.6 9.4h4.8" />
        </>
      );
    case "folder":
      // A folder reduced to two lines: the body outline + a single
      // seam where the raised tab meets the body. The seam is the
      // accent line — it draws the eye to the join.
      return (
        <>
          <path
            className="rail-glyph-shell"
            d="M3.6 7.6A1.8 1.8 0 0 1 5.4 5.8h3.8a1.8 1.8 0 0 1 1.43.7l1.07 1.4h6.7a1.8 1.8 0 0 1 1.8 1.8V18a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2Z"
          />
          <path className="rail-glyph-stroke" d="M3.6 11.4h16.8" />
        </>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
