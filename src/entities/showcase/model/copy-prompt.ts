import type { ShowcaseItem } from "./types";

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

function isCopyPromptInput(value: unknown): value is CopyPromptInput {
  if (!isRecord(value)) return false;
  if (typeof value.title !== "string") return false;
  if (!isOptionalString(value.linkUrl)) return false;
  if (!isOptionalString(value.assetPath)) return false;
  if (!isOptionalString(value.sourceUrl)) return false;
  if (!isOptionalStringArray(value.tags)) return false;
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

  const cssUrl: string = createSiblingAssetUrl(htmlUrl, "styles.css");
  const jsUrl: string = createSiblingAssetUrl(htmlUrl, "script.js");

  const tags: readonly string[] = input.tags ?? [];
  const tagLine: string = tags.length > 0 ? `\nTags: ${tags.join(", ")}` : "";

  return `You are a senior frontend engineering agent. Recreate the component or visual experience represented by the deployed asset bundle below inside the user's current project.

Showcase title: ${input.title}
HTML URL: ${htmlUrl}
CSS URL: ${cssUrl}
JS URL: ${jsUrl}${tagLine}

Context and constraints:
- The three URLs above point to the deployed HTML entry and its sibling stylesheet and script. Fetch and read them directly as the authoritative reference.
- Do not rely on or ask for a repository URL or a rendered preview URL; the HTML, CSS, and JavaScript above are sufficient to reproduce the visual result and interactions.
- Different showcases may ship different HTML, CSS, and JavaScript sources, but the integration structure should remain consistent.
- Before implementing, inspect the user's current project architecture, technology stack, directory boundaries, component patterns, styling system, and existing utilities.
- Adapt the implementation to the user's project instead of copying the raw page structure directly.
- If any requirement, interaction, data source, integration target, or technical constraint is unclear, stop and ask the user for clarification before proceeding.

Implementation requirements:
1. Read the HTML, CSS, and JavaScript from the URLs above and infer the reusable structure, styling, assets, states, and key interactions needed to reproduce the experience.
2. Implement the result using the current project's stack, conventions, component abstractions, styling tokens, and utility APIs.
3. Keep the solution maintainable, reusable, accessible, and testable.
4. Avoid introducing new dependencies unless the existing project stack cannot reasonably support the implementation.
5. When multiple files are changed, explain each file's responsibility and provide a concise validation plan.`;
}
