import type { ShowcaseItem } from "@/entities/showcase/model/types";

export const showcaseItems = [
  {
    id: "harnesskit-agent-cards",
    title: "HarnessKit Agent Cards High Fidelity Demo",
    source: "local tmp import",
    kind: "Demo",
    tone: "stack",
    span: "wide",
    status: "new",
    tags: ["agent", "cards", "ui", "demo"],
    sourceUrl: "tmp/index.html",
    sourcePlatform: "local tmp import",
    assetPath: "/community-showcases/harnesskit-agent-cards/index.html",
    zipPath: "/community-zips/harnesskit-agent-cards.zip",
    linkUrl: "/community-showcases/harnesskit-agent-cards/index.html",
    preview: {
      width: 1060,
      height: 640,
    },
  },
] satisfies ShowcaseItem[];
