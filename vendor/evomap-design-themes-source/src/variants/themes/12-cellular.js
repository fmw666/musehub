// 12. Cellular Field — adapted from cellular-cluster-field. A grid of
// nodes where wandering "nuclei" activate cells, drawing membranes +
// connections. Uses the Canvas2D engine instead of the WebGL halftone
// pipeline, so `engine: "cellular"` is required to route correctly.

export default {
    id: "cellular",
    name: "12 · Cellular Field",
    tagline: "Cluster of agents — wandering, splitting, signalling",
    engine: "cellular",
    // shaderConfig is what main.js forwards to the engine; for cellular it
    // overrides the createCellularHero defaults.
    shaderConfig: {
        gridSpacing: 38,
        // 横/纵相邻膜圆相切: 2 × cellMaxRadius = gridSpacing, 即 19。
        // 对角邻接仍会留出 ~√2 - 1 ≈ 41% 的间隙, 这是正方形网格上"轴向相切"
        // 的几何最优解; 想让对角也相切需要把半径再放大到 ~gridSpacing/√2,
        // 但那样横纵方向会大幅重叠。
        cellMaxRadius: 19,
        membraneStrokeWidth: 0.7,
        membraneOpacity: 0.7,
        nucleusSize: 2.5,
        connectionOpacity: 0.12,
        ghostTrail: 0.18,
        globalSpeed: 0.9,
        nucleusSpeed: 0.012,
        nucleusCountRatio: 0.12,
        clusterCohesion: 0.18,
        cohesionRatio: 0.6,
        boidsWeight: 0.25,
        wanderSparsity: 1.4,
        nucleusSplitProb: 0.006,
        homeostasisRate: 0.025,
        // Keep growth contiguous: new nuclei almost always clone off an
        // existing one rather than appearing at random points across the
        // canvas. Lets the seed blob spread organically outward.
        randomSpawnProb: 0.005,
        membraneColor: "#bfe9ff",
        nucleusColor: "#ffffff",
        connectionColor: "#9fd5ff",
        bgColor: "#020611",
        vignetteStrength: 0.45,
        // ── Split-pane layout: text on the left, field on the right ──
        // Initial: 3-5 small patches, mostly left-leaning, so first paint
        // reads as "a few clusters with open space between" rather than a
        // dense fog. Over ~6s the right-bias ramp + homeostasis grow the
        // field outward; the left-load corridor below caps left density
        // at steady state so the text column underneath remains legible
        // but is never empty. Other themes keep their defaults — every
        // knob below is additive.
        initialUniform: true,
        // Tiny initial seed count — patches will look sparse on frame 1.
        // Steady-state density is governed by nucleusCountRatio above.
        initialSeedRatio: 0.025,
        rightBias: 0.4,
        rightBiasRamp: 6.0,
        // Left half is allowed up to ~70% of the right's natural density.
        // The visual effect is a soft gradient (denser on the right where
        // the field lives, lighter on the left where the text sits)
        // rather than a hard wall.
        leftLoadFactor: 0.7,
    },
    theme: {
        "--bg-from": "#0a1632",
        "--bg-via": "#020611",
        "--bg-to": "#000000",
        "--bg-mode": "radial",
        "--text": "#e8f4ff",
        "--text-soft": "rgba(232,244,255,0.72)",
        "--ring": "rgba(190,233,255,0.05)",
        "--cta-bg": "#bfe9ff",
        "--cta-fg": "#06122e",
        "--cta-shadow": "0 0 32px rgba(190,233,255,0.25)",
        "--accent": "#bfe9ff",
    },
    copy: {
        eyebrow: "AGENT FIELD",
        lineA: "A million nuclei,",
        lineB: "one cluster.",
        body: "Each agent wanders, splits, and signals — and out of those simple rules a living network emerges.",
        cta: "Touch to seed nuclei",
    },
};
