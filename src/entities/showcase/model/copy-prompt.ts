import type { ShowcaseEnvironment, ShowcaseItem } from "./types";

/**
 * Local structural contract for the copy-prompt builder.
 * Decouples this file from the external `ShowcaseItem` type so that
 * cross-file type resolution flakiness in IDE language services
 * (e.g. @typescript-eslint "unsafe-*" false positives) cannot affect us.
 */
type CopyPromptInput = {
  title: string;
  linkUrl?: string;
  assetPath?: string;
  sourceUrl?: string;
  tags?: readonly string[];
  environment?: ShowcaseEnvironment;
  assets?: {
    html: string;
    styles: readonly string[];
    scripts: readonly string[];
    media?: readonly string[];
  };
};

const knownEnvironments: readonly ShowcaseEnvironment[] = [
  "vanilla",
  "react",
  "vue",
  "svelte",
  "solid",
  "angular",
];

const environmentLabels: Record<ShowcaseEnvironment, string> = {
  vanilla: "Vanilla HTML, CSS, and JavaScript",
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  solid: "SolidJS",
  angular: "Angular",
};

const environmentGuidance: Record<ShowcaseEnvironment, string> = {
  vanilla:
    "This bundle is a static HTML entry with sibling CSS and JavaScript files. Treat it as a self-contained vanilla web component reference and adapt it into the user's framework of choice.",
  react:
    "This bundle is a self-contained React build (entry HTML loads pre-bundled React JavaScript). Read the JavaScript to recover component structure, props, state, and effects, then re-implement using the user's React conventions and component primitives.",
  vue: "This bundle is a self-contained Vue build. Recover component structure, reactive state, and template intent from the JavaScript, then re-implement using the user's Vue conventions.",
  svelte:
    "This bundle is a self-contained Svelte build. Recover component structure, stores, and reactive logic from the JavaScript, then re-implement using the user's Svelte conventions.",
  solid:
    "This bundle is a self-contained SolidJS build. Recover signals, components, and effects from the JavaScript, then re-implement using the user's Solid conventions.",
  angular:
    "This bundle is a self-contained Angular build. Recover modules, components, services, and templates from the JavaScript, then re-implement using the user's Angular conventions.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalStringArray(value: unknown): value is readonly string[] | undefined {
  if (value === undefined) return true;
  if (!Array.isArray(value)) return false;
  return value.every((entry) => typeof entry === "string");
}

function isOptionalEnvironment(value: unknown): value is ShowcaseEnvironment | undefined {
  if (value === undefined) return true;
  if (typeof value !== "string") return false;
  return (knownEnvironments as readonly string[]).includes(value);
}

function isOptionalAssets(value: unknown): value is CopyPromptInput["assets"] | undefined {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  if (typeof value.html !== "string") return false;
  if (!Array.isArray(value.styles) || !value.styles.every((s) => typeof s === "string")) {
    return false;
  }
  if (!Array.isArray(value.scripts) || !value.scripts.every((s) => typeof s === "string")) {
    return false;
  }
  if (value.media !== undefined) {
    if (!Array.isArray(value.media) || !value.media.every((s) => typeof s === "string")) {
      return false;
    }
  }
  return true;
}

function isCopyPromptInput(value: unknown): value is CopyPromptInput {
  if (!isRecord(value)) return false;
  if (typeof value.title !== "string") return false;
  if (!isOptionalString(value.linkUrl)) return false;
  if (!isOptionalString(value.assetPath)) return false;
  if (!isOptionalString(value.sourceUrl)) return false;
  if (!isOptionalStringArray(value.tags)) return false;
  if (!isOptionalEnvironment(value.environment)) return false;
  if (!isOptionalAssets(value.assets)) return false;
  return true;
}

function createAbsoluteUrl(pathOrUrl: string | undefined, origin: string): string | undefined {
  if (!pathOrUrl) {
    return undefined;
  }

  return new URL(pathOrUrl, origin).toString();
}

/**
 * Derive a sibling asset URL (e.g. `styles.css`, `script.js`) from an
 * HTML entry URL. The showcase convention is that every asset lives under
 * the same directory as `index.html`.
 */
function createSiblingAssetUrl(htmlUrl: string, siblingFileName: string): string {
  return new URL(siblingFileName, htmlUrl).toString();
}

function formatAssetUrlList(label: string, urls: readonly string[]): string {
  if (urls.length === 0) {
    return "";
  }
  if (urls.length === 1) {
    return `\n${label} URL: ${urls[0]}`;
  }
  const lines = urls.map((url, index) => `  ${index + 1}. ${url}`).join("\n");
  return `\n${label} URLs:\n${lines}`;
}

export function createShowcaseCopyPrompt(item: ShowcaseItem, origin: string): string | undefined {
  if (!isCopyPromptInput(item)) {
    return undefined;
  }
  const input: CopyPromptInput = item;

  const candidate: string | undefined = input.linkUrl ?? input.assetPath;
  const htmlUrl: string | undefined = createAbsoluteUrl(candidate, origin);
  if (!htmlUrl) {
    return undefined;
  }

  const styleFiles: readonly string[] = input.assets?.styles ?? ["styles.css"];
  const scriptFiles: readonly string[] = input.assets?.scripts ?? ["script.js"];
  const mediaFiles: readonly string[] = input.assets?.media ?? [];
  const cssUrls: readonly string[] = styleFiles.map((file) => createSiblingAssetUrl(htmlUrl, file));
  const jsUrls: readonly string[] = scriptFiles.map((file) => createSiblingAssetUrl(htmlUrl, file));
  const mediaUrls: readonly string[] = mediaFiles.map((file) =>
    createSiblingAssetUrl(htmlUrl, file),
  );

  const tags: readonly string[] = input.tags ?? [];
  const tagLine: string = tags.length > 0 ? `\nTags: ${tags.join(", ")}` : "";

  const environment: ShowcaseEnvironment = input.environment ?? "vanilla";
  const environmentLabel: string = environmentLabels[environment];
  const environmentNote: string = environmentGuidance[environment];

  const cssBlock: string = formatAssetUrlList("CSS", cssUrls);
  const jsBlock: string = formatAssetUrlList("JavaScript", jsUrls);
  const mediaBlock: string = formatAssetUrlList("Media", mediaUrls);
  const mediaNote: string =
    mediaUrls.length > 0
      ? "\n- The Media URLs above are the showcase's video assets. Treat them as illustrative material that the rebuilt experience should be able to play, not as scriptable content."
      : "";

  return `You are a senior frontend engineering agent. Recreate the component or visual experience represented by the deployed asset bundle below inside the user's current project.

Showcase title: ${input.title}
Source environment: ${environmentLabel}
HTML URL: ${htmlUrl}${cssBlock}${jsBlock}${mediaBlock}${tagLine}

Context and constraints:
- ${environmentNote}
- The URLs above point to the deployed HTML entry and every sibling stylesheet, script, and media file in the bundle. Fetch and read them directly as the authoritative reference.
- A showcase always has a single \`index.html\` entry but may ship multiple stylesheet, script, and media siblings (videos use \`.mp4\` or \`.webm\`); treat the listed URLs as the complete asset surface.${mediaNote}
- Do not rely on or ask for a repository URL or a rendered preview URL; the listed HTML, CSS, JavaScript, and media files are sufficient to reproduce the visual result and interactions.
- Different showcases may ship different HTML, CSS, JavaScript, and media sources, but the integration structure should remain consistent.
- Before implementing, inspect the user's current project architecture, technology stack, directory boundaries, component patterns, styling system, and existing utilities.
- Adapt the implementation to the user's project instead of copying the raw page structure directly.
- If any requirement, interaction, data source, integration target, or technical constraint is unclear, stop and ask the user for clarification before proceeding.

Implementation requirements:
1. Read every HTML, CSS, JavaScript, and media URL above and infer the reusable structure, styling, assets, states, and key interactions needed to reproduce the experience.
2. Implement the result using the current project's stack, conventions, component abstractions, styling tokens, and utility APIs.
3. Keep the solution maintainable, reusable, accessible, and testable.
4. Avoid introducing new dependencies unless the existing project stack cannot reasonably support the implementation.
5. When multiple files are changed, explain each file's responsibility and provide a concise validation plan.`;
}
