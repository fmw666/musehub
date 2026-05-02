/*
 * Inlined rail navigation glyphs.
 *
 * Previously pulled SquarePen / Compass / Folder / Bookmark from lucide-react,
 * which packaged the full `createLucideIcon` runtime into the critical path
 * chunk even for only 4 icons (~200kB raw). These four glyphs appear on every
 * route (the persistent side rail), so bundling them inline saves main-bundle
 * JS and removes Lucide from the critical path for the rail itself.
 *
 * Path data and visual attributes copied verbatim from lucide-react@1.14.0
 * (ISC license) so the rail icons remain byte-for-byte identical:
 *   - viewBox="0 0 24 24"
 *   - stroke="currentColor" stroke-width="2"
 *   - stroke-linecap="round" stroke-linejoin="round"
 *   - fill="none"
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
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "rail-glyph",
  "aria-hidden": true,
};

export function RailGlyph({ name }: RailGlyphProps) {
  switch (name) {
    case "compose":
      return (
        <svg {...baseSvgProps}>
          <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
        </svg>
      );
    case "compass":
      return (
        <svg {...baseSvgProps}>
          <circle cx="12" cy="12" r="10" />
          <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
        </svg>
      );
    case "folder":
      return (
        <svg {...baseSvgProps}>
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...baseSvgProps}>
          <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
        </svg>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
