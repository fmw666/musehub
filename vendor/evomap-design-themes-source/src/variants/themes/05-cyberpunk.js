// 05. Cyberpunk Magenta — neon dystopia, tilted ring (radial dots).
import { baseShape } from "../shared.js";

export default {
    id: "cyberpunk",
    name: "05 · Cyberpunk",
    tagline: "Neon magenta + cyan",
    shaderConfig: {
        ...baseShape,
        dotColor: "#ff3df0",
        dotSize: 7,
        dotMargin: 0,
        minDotSize: 1,
        gridLayout: "radial",
        gamma: 0.85,
        animSpeed: 5,
        fluidStrength: 0.28,
        dotAlphaMultiplier: 1.2,
        ringRotationSpeed: 0.12,
        breath: 1.6,
    },
    theme: {
        "--bg-from": "#1a0033",
        "--bg-via": "#3d0a5c",
        "--bg-to": "#0a0014",
        "--bg-mode": "radial",
        "--text": "#ffffff",
        "--text-soft": "rgba(255,255,255,0.78)",
        "--ring": "rgba(255,61,240,0.12)",
        "--cta-bg": "#00ffe5",
        "--cta-fg": "#1a0033",
        "--cta-shadow": "0 0 36px rgba(0,255,229,0.5)",
        "--accent": "#00ffe5",
    },
    copy: {
        eyebrow: "RUNTIME 2049",
        lineA: "Skills you can",
        lineB: "publish, fork, and earn from.",
        body: "Capsules of experience that travel between agents — credits as fuel, capabilities as currency.",
        cta: "Jack in →",
    },
};
