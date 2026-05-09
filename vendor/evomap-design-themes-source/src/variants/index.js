// MuseHub curated set: 8 visually distinct themes copied from
// evomap/evomap-design-dashboard.
//
// Variants intentionally skipped to avoid visual duplication with the
// existing community wall (the `antimetal-hero-replica` already covers
// the deep-cyan halftone aesthetic):
//   01 classic / 11 video / 13 genesis / 14 fireworks
//     – all share Classic's dark-cyan palette; only intro/breath overlays
//       differ. Once the overlay finishes the look collapses back to 01.
//   03 sunset – warm-dusk halftone, palette overlaps 07 solar.
//   10 frost  – icy variant of Classic; same dot-field grammar.
//
// What remains is one card per *visual identity*: bright signal-blue
// with lime CTA, terminal green, neon magenta-radial, print halftone,
// burning-sun radial, pastel mint brick, minimal greyscale, and a
// completely different engine (Canvas2D cellular cluster field).

import aurora from "./themes/02-aurora.js";
import matrix from "./themes/04-matrix.js";
import cyberpunk from "./themes/05-cyberpunk.js";
import newspaper from "./themes/06-newspaper.js";
import solar from "./themes/07-solar.js";
import mint from "./themes/08-mint.js";
import neutral from "./themes/09-neutral.js";
import cellular from "./themes/12-cellular.js";

export const variants = [
    aurora,
    matrix,
    cyberpunk,
    newspaper,
    solar,
    mint,
    neutral,
    cellular,
];
