export type ShowcaseTone = "mint" | "fan" | "void" | "postal" | "phone" | "stack";

/**
 * Frontend technology environment a showcase targets. The runtime contract is
 * still always a single static `index.html` entry plus relative siblings, but
 * the environment changes how we describe the bundle in copy-prompts and how
 * we group downloadable artifacts (e.g. a vanilla zip vs. a React port zip).
 */
export type ShowcaseEnvironment = "vanilla" | "react" | "vue" | "svelte" | "solid" | "angular";

/**
 * Explicit asset listing for a showcase. Lets a single `index.html` reference
 * any number of sibling stylesheet and script files instead of the legacy
 * fixed `styles.css` + `script.js` pair. Filenames are sibling paths relative
 * to the entry HTML and must not contain directory traversal segments.
 */
export type ShowcaseAssets = {
  html: string;
  styles: readonly string[];
  scripts: readonly string[];
};

/**
 * `kind` is the unique key used to identify a download variant inside a
 * showcase. The known {@link ShowcaseEnvironment} values are the canonical
 * choices, but a showcase may also publish bespoke variants (for example
 * "minimal" or "with-tests"), so plain strings are also allowed.
 */
export type ShowcaseDownloadKind = ShowcaseEnvironment | (string & {});

export type ShowcaseDownload = {
  kind: ShowcaseDownloadKind;
  label: string;
  url: string;
  description?: string;
};

export type ShowcaseItem = {
  id: string;
  title: string;
  source: string;
  kind: string;
  tone: ShowcaseTone;
  span: "hero" | "wide" | "medium" | "tall" | "compact";
  status: "featured" | "new" | "archived";
  tags?: readonly string[];
  sourceUrl?: string;
  sourcePlatform?: string;
  assetPath?: string;
  prompt?: string;
  zipPath?: string;
  linkUrl?: string;
  favorites?: number;
  likes?: number;
  environment?: ShowcaseEnvironment;
  assets?: ShowcaseAssets;
  downloads?: readonly ShowcaseDownload[];
  preview?: {
    width: number;
    height: number;
    displayWidth?: number;
  };
};
