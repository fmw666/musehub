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
    preview: {
      width: 1060,
      height: 640,
    },
  },
] satisfies ShowcaseItem[];
