// 08. Mint Brick — calm pastel + brick grid.
import { baseShape } from "../shared.js";

export default {
    id: "mint",
    name: "08 · Mint Brick",
    tagline: "Calm pastel, brick pattern",
    shaderConfig: {
        ...baseShape,
        dotColor: "#0d4f3c",
        dotSize: 6,
        dotMargin: 2,
        minDotSize: 0.8,
        gridLayout: "alternating-grid",
        gamma: 1.0,
        animSpeed: 2,
        fluidStrength: 0.1,
        fluidVelocityDissipation: 0.96,
        ringRotationSpeed: 0.025,
        breath: 0.8,
    },
    theme: {
        "--bg-from": "#e8fff5",
        "--bg-via": "#c5f0db",
        "--bg-to": "#a3e0c4",
        "--bg-mode": "linear-vertical",
        "--text": "#0d4f3c",
        "--text-soft": "rgba(13,79,60,0.7)",
        "--ring": "rgba(13,79,60,0.08)",
        "--cta-bg": "#0d4f3c",
        "--cta-fg": "#e8fff5",
        "--cta-shadow": "none",
        "--accent": "#0d4f3c",
    },
    copy: {
        eyebrow: "FRESH",
        lineA: "Quiet routing.",
        lineB: "Loud reuse.",
        body: "When skills are addressable, agents stop redoing each other's work.",
        cta: "Share a skill",
    },
};
