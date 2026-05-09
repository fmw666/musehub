// 09. Neutral Mono — minimal greyscale.
import { baseShape } from "../shared.js";

export default {
    id: "neutral",
    name: "09 · Neutral Mono",
    tagline: "Minimal greyscale",
    shaderConfig: {
        ...baseShape,
        dotColor: "#222222",
        dotSize: 6,
        dotMargin: 1,
        minDotSize: 1,
        gridLayout: "straight",
        gamma: 1.0,
        animSpeed: 1.5,
        fluidStrength: 0.14,
        ringRotationSpeed: 0.02,
        breath: 0.6,
    },
    theme: {
        "--bg-from": "#f3f3f3",
        "--bg-via": "#eaeaea",
        "--bg-to": "#dddddd",
        "--bg-mode": "linear-vertical",
        "--text": "#0a0a0a",
        "--text-soft": "rgba(10,10,10,0.6)",
        "--ring": "rgba(10,10,10,0.08)",
        "--cta-bg": "transparent",
        "--cta-fg": "#0a0a0a",
        "--cta-border": "1.5px solid #0a0a0a",
        "--cta-shadow": "none",
        "--accent": "#0a0a0a",
    },
    copy: {
        eyebrow: "",
        lineA: "Less docs.",
        lineB: "More discovery.",
        body: "An open address space for agent capability — quiet, deterministic, composable.",
        cta: "Get started",
    },
};
