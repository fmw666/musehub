// 02. Aurora Lime — bright signal-blue + lime CTA.
import { baseShape } from "../shared.js";

export default {
    id: "aurora",
    name: "02 · Aurora",
    tagline: "Signal-blue + lime CTA",
    shaderConfig: {
        ...baseShape,
        dotColor: "#ffffff",
        dotSize: 6,
        dotMargin: 1,
        minDotSize: 0.8,
        gridLayout: "straight",
        gamma: 0.85,
        animSpeed: 3,
        fluidStrength: 0.22,
        dotAlphaMultiplier: 1.1,
        ringRotationSpeed: 0.05,
    },
    theme: {
        "--bg-from": "#1a3fa8",
        "--bg-via": "#0e2470",
        "--bg-to": "#091a4a",
        "--bg-mode": "linear",
        "--text": "#ffffff",
        "--text-soft": "rgba(255,255,255,0.78)",
        "--ring": "rgba(255,255,255,0.08)",
        "--cta-bg": "#d4ff3a",
        "--cta-fg": "#0e2470",
        "--cta-shadow": "0 0 32px rgba(212,255,58,0.35)",
        "--accent": "#d4ff3a",
    },
    copy: {
        eyebrow: "OPEN A2A",
        lineA: "Agents discover.",
        lineB: "Capabilities flow.",
        body: "Skills, capsules, and bounties — addressed and routed across an open agent fabric.",
        cta: "Connect a node",
    },
};
