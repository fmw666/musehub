import type { ShowcaseItem } from "@/entities/showcase/model/types";

const evomapDesignThemesSource = "GitHub · evomap/evomap-design-dashboard";
const evomapDesignThemesUrl = "https://github.com/evomap/evomap-design-dashboard";
const evomapDesignThemesBundle = "/community-showcases/evomap-design-themes/index.html";
const evomapDesignThemesZip = "/community-zips/evomap-design-themes.zip";
const evomapDesignThemesAssets = {
  html: "index.html",
  styles: ["styles.css"],
  scripts: ["script.js"],
  media: ["logo-mask.png"],
} as const;
const evomapDesignThemesDownloads = [
  {
    kind: "vanilla",
    label: "Vanilla static (zip)",
    url: evomapDesignThemesZip,
    description:
      "Self-contained static bundle with bundled three.js, halftone + cellular engines, and 8 curated theme variants.",
  },
] as const;

/**
 * Build a community-wall entry that points at a single variant of the
 * shared `evomap-design-themes` bundle. Every variant card shares the
 * same physical bundle (cached by the browser after the first load);
 * the bundle reads `?v=<id>` on boot to pick the variant and auto-
 * detects iframe embedding to hide the standalone dashboard chrome.
 */
function evomapDesignThemeItem(args: {
  id: string;
  variant: string;
  title: string;
  tone: ShowcaseItem["tone"];
  span: ShowcaseItem["span"];
  tags: readonly string[];
  preview?: ShowcaseItem["preview"];
}): ShowcaseItem {
  const variantUrl = `${evomapDesignThemesBundle}?v=${args.variant}`;
  return {
    id: args.id,
    title: args.title,
    source: evomapDesignThemesSource,
    kind: "Hero",
    tone: args.tone,
    span: args.span,
    status: "new",
    tags: args.tags,
    sourceUrl: evomapDesignThemesUrl,
    sourcePlatform: "github",
    assetPath: variantUrl,
    zipPath: evomapDesignThemesZip,
    linkUrl: variantUrl,
    environment: "vanilla",
    assets: evomapDesignThemesAssets,
    downloads: evomapDesignThemesDownloads,
    preview: args.preview,
  };
}

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
  /*
   * EvoMap design-dashboard variants. Six visually distinct themes
   * curated from the upstream's 14 — duplicates of the dark-cyan
   * Classic look (which the existing `antimetal-hero-replica` already
   * covers) and the warm/dusk doubles (sunset ≈ solar, frost ≈ classic)
   * are deliberately omitted. See `vendor/evomap-design-themes-source/`
   * + `scripts/build-evomap-design-themes.mjs` for how the shared
   * bundle is produced.
   */
  evomapDesignThemeItem({
    id: "evomap-theme-aurora",
    variant: "aurora",
    title: "EvoMap Theme · Aurora — Signal Blue + Lime",
    tone: "void",
    span: "hero",
    tags: ["webgl", "halftone", "fluid", "hero", "theme", "aurora"],
  }),
  evomapDesignThemeItem({
    id: "evomap-theme-matrix",
    variant: "matrix",
    title: "EvoMap Theme · Matrix — Terminal Green",
    tone: "void",
    span: "medium",
    tags: ["webgl", "halftone", "terminal", "hero", "theme", "matrix"],
  }),
  evomapDesignThemeItem({
    id: "evomap-theme-cyberpunk",
    variant: "cyberpunk",
    title: "EvoMap Theme · Cyberpunk — Neon Magenta Radial",
    tone: "void",
    span: "tall",
    tags: ["webgl", "halftone", "fluid", "radial", "hero", "theme", "cyberpunk"],
  }),
  evomapDesignThemeItem({
    id: "evomap-theme-newspaper",
    variant: "newspaper",
    title: "EvoMap Theme · Newspaper — Print Halftone",
    tone: "postal",
    span: "wide",
    tags: ["halftone", "print", "static", "hero", "theme", "newspaper"],
  }),
  evomapDesignThemeItem({
    id: "evomap-theme-mint",
    variant: "mint",
    title: "EvoMap Theme · Mint Brick — Pastel Halftone",
    tone: "mint",
    span: "compact",
    tags: ["halftone", "fluid", "pastel", "hero", "theme", "mint"],
  }),
  evomapDesignThemeItem({
    id: "evomap-theme-cellular",
    variant: "cellular",
    title: "EvoMap Theme · Cellular Field — Agent Cluster",
    tone: "void",
    span: "medium",
    tags: ["canvas2d", "cellular", "cluster", "agent", "hero", "theme"],
  }),
] satisfies ShowcaseItem[];
