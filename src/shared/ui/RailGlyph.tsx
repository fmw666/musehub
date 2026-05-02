/*
 * Atelier Ink rail glyph set.
 *
 * The four navigation icons + the user `Atelier Medallion` (rendered
 * separately in RailUserMenu) share one visual grammar so the side rail
 * reads as a coherent set rather than five unrelated pictograms.
 *
 * Each glyph is composed from exactly three semantic parts:
 *
 *   .rail-glyph-shell  — the recognizable outer pictogram (closed,
 *                        crisp, no broken outlines).
 *   .rail-glyph-stroke — one supporting interior line: a needle, a
 *                        brushstroke, a seam, a fold, a ridge.
 *   .rail-glyph-accent — a small honey "ink ember" pinned at a
 *                        meaningful point on the glyph (the compass
 *                        pivot, the page corner-fold, the favorite's
 *                        heart, the folder's label, the artist's
 *                        signature). The ember glows softly even at
 *                        rest and fully ignites on hover / active.
 *
 * The marks are upright (no rotation) — the rail is navigation and must
 * read as stable. All shared color, stroke weight, and motion behavior
 * live in side-rail.css under the `.rail-glyph-*` selectors.
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
      // Mariner's disc, a slim diamond needle, and the pivot pin as the
      // ember. The cardinal tick marks at N/S/E/W give the disc the
      // engraved-instrument feel without crowding it.
      return (
        <>
          <circle className="rail-glyph-shell" cx="12" cy="12" r="8.4" />
          <path className="rail-glyph-stroke" d="M12 5.6 13.6 12 12 18.4 10.4 12 Z" />
          <path className="rail-glyph-tick" d="M12 3.2v1.4M12 19.4v1.4M3.2 12h1.4M19.4 12h1.4" />
          <circle className="rail-glyph-accent" cx="12" cy="12" r="1.3" />
        </>
      );
    case "compose":
      // A sheet of paper with a folded top-right corner (structural —
      // part of the shell) crossed by a single calligraphic brushstroke
      // rising diagonally. The ember sits inside the corner fold like
      // wet ink just laid.
      return (
        <>
          <path
            className="rail-glyph-shell"
            d="M5.6 5.4a1.4 1.4 0 0 1 1.4-1.4h6.6a1.4 1.4 0 0 1 .99.41l3.4 3.4a1.4 1.4 0 0 1 .41.99v9.8A1.4 1.4 0 0 1 17 20H7a1.4 1.4 0 0 1-1.4-1.4Z"
          />
          <path className="rail-glyph-shell" d="M14 4v3a1.4 1.4 0 0 0 1.4 1.4h3" />
          <path className="rail-glyph-stroke" d="M8.4 17c1.7-1.4 3.6-3.3 5.6-6" />
          <circle className="rail-glyph-accent" cx="16.4" cy="6.4" r="1.25" />
        </>
      );
    case "bookmark":
      // Notched ribbon with a crisp V-bottom. Two stacked title bands
      // give the ribbon weight and rhythm, and the ember sits as a
      // wax-seal pressed into the heart of the ribbon below them.
      return (
        <>
          <path
            className="rail-glyph-shell"
            d="M7.4 4.6a1 1 0 0 1 1-1h7.2a1 1 0 0 1 1 1V20l-4.6-3-4.6 3Z"
          />
          <path className="rail-glyph-stroke" d="M9.4 7.8h5.2M9.4 10.2h5.2" />
          <circle className="rail-glyph-accent" cx="12" cy="13.4" r="1.3" />
        </>
      );
    case "folder":
      // A folder with a raised tab. A single horizontal seam shows the
      // tab meeting the body, and a centered ember rests on that seam
      // like a label pressed onto the spine of your archive.
      return (
        <>
          <path
            className="rail-glyph-shell"
            d="M3.6 7.6A1.8 1.8 0 0 1 5.4 5.8h3.8a1.8 1.8 0 0 1 1.43.7l1.07 1.4h6.7a1.8 1.8 0 0 1 1.8 1.8V18a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2Z"
          />
          <path className="rail-glyph-stroke" d="M3.6 11.4h16.8" />
          <circle className="rail-glyph-accent" cx="12" cy="11.4" r="1.3" />
        </>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
