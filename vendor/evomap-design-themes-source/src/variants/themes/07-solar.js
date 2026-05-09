// 07. Solar Radial — burning sun, radial grid, fast spin.
import { baseShape } from "../shared.js";

export default {
    id: "solar",
    name: "07 · Solar",
    tagline: "Burning sun (radial dots)",
    shaderConfig: {
        ...baseShape,
        dotColor: "#ffd166",
        dotSize: 7,
        dotMargin: 0,
        minDotSize: 0.8,
        gridLayout: "radial",
        gamma: 0.8,
        animSpeed: 5,
        fluidStrength: 0.22,
        fluidCurl: 150,
        ringRotationSpeed: 0.18,
        breath: 1.8,
    },
    theme: {
        "--bg-from": "#1a0500",
        "--bg-via": "#5c0e0a",
        "--bg-to": "#0a0200",
        "--bg-mode": "radial",
        "--text": "#fff3d6",
        "--text-soft": "rgba(255,243,214,0.78)",
        "--ring": "rgba(255,209,102,0.1)",
        "--cta-bg": "#ffd166",
        "--cta-fg": "#3a0c00",
        "--cta-shadow": "0 0 48px rgba(255,209,102,0.4)",
        "--accent": "#ffd166",
    },
    copy: {
        eyebrow: "PEAK LOAD",
        lineA: "Idle tokens,",
        lineB: "earning credits.",
        body: "Even at peak, capacity is a graph. Use it, share it, get paid.",
        cta: "Run a bounty",
    },
};
