// Shared geometry baseline for all themes.
// Every theme spreads `baseShape` first and then overrides what it cares about.
// This keeps the visual identity (the EvoMap "vertical-ribbons" emblem)
// consistent across variants — only colors, dot sizes, fluid behaviour and
// CSS theme tokens vary per theme.

const PI = Math.PI;

// Tuning dials repurposed by the procedural fallback shader (logoFrag):
//   nodes[0].radius = band half-thickness
//   nodes[1].radius = side-wedge size scale (0 disables the wedges)
//   nodes[2].angle  = tip cut angle in radians (~PI/6 = 30°)
export const NODES_REFERENCE = [
    { angle: 0.0, dist: 0.0, radius: 0.085 },
    { angle: 0.0, dist: 0.0, radius: 1.0 },
    { angle: PI / 6, dist: 0.0, radius: 0.0 },
];

export const baseShape = {
    ringInner: 0.16,
    ringOuter: 0.62,
    ringSoftness: 0.012,
    ringRotationSpeed: 0.0,
    breath: 1.0,
    ringFill: 0,
    nodes: NODES_REFERENCE,
};
