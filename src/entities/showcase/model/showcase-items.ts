import type { ShowcaseItem } from "@/entities/showcase/model/types";

export const showcaseItems = [
  {
    id: "harnesskit-agent-cards",
    title: "HarnessKit Agent Cards High Fidelity Demo",
    source: "GitHub · RealZST/HarnessKit",
    kind: "Demo",
    tone: "stack",
    span: "wide",
    status: "new",
    tags: ["agent", "cards", "ui", "demo", "github", "open-source"],
    sourceUrl: "https://github.com/RealZST/HarnessKit",
    sourcePlatform: "github",
    assetPath: "/community-showcases/harnesskit-agent-cards/index.html",
    zipPath: "/community-zips/harnesskit-agent-cards.zip",
    linkUrl: "/community-showcases/harnesskit-agent-cards/index.html",
    environment: "react",
    assets: {
      html: "index.html",
      styles: ["styles.css"],
      scripts: ["script.js"],
    },
    downloads: [
      {
        kind: "react",
        label: "React bundle (zip)",
        url: "/community-zips/harnesskit-agent-cards.zip",
        description:
          "Self-contained static React build with HTML entry, CSS, and pre-bundled JavaScript.",
      },
    ],
    preview: {
      width: 812,
      height: 274,
      displayWidth: 1060,
    },
  },
  {
    id: "antimetal-hero-replica",
    title: "Antimetal Hero — 1:1 Replica",
    source: "Web · antimetal.com",
    kind: "Hero",
    tone: "void",
    span: "wide",
    status: "new",
    tags: ["webgl", "shader", "hero", "three-js"],
    sourceUrl: "https://antimetal.com",
    sourcePlatform: "website",
    assetPath: "/community-showcases/antimetal-hero-replica/index.html",
    zipPath: "/community-zips/antimetal-hero-replica.zip",
    linkUrl: "/community-showcases/antimetal-hero-replica/index.html",
    environment: "vanilla",
    assets: {
      html: "index.html",
      styles: ["style.css"],
      scripts: ["app.js", "hero.js", "shaders.js", "three-vendor.js"],
      media: ["video.mp4", "video-mask.avif"],
    },
    downloads: [
      {
        kind: "vanilla",
        label: "Vanilla static (zip)",
        url: "/community-zips/antimetal-hero-replica.zip",
        description:
          "Self-contained static HTML bundle with bundled three.js and original hero video assets.",
      },
    ],
  },
] satisfies ShowcaseItem[];
