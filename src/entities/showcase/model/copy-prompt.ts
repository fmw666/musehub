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

export function createShowcaseCopyPrompt(item: ShowcaseItem, origin: string): string | undefined {
  if (!isCopyPromptInput(item)) {
    return undefined;
  }
  const input: CopyPromptInput = item;

  const candidate: string | undefined = input.linkUrl ?? input.assetPath;
  const previewUrl: string | undefined = createAbsoluteUrl(candidate, origin);
  if (!previewUrl) {
    return undefined;
  }

  const sourceLine: string = input.sourceUrl ? `\nSource project: ${input.sourceUrl}` : "";
  const tags: readonly string[] = input.tags ?? [];
  const tagLine: string = tags.length > 0 ? `\nTags: ${tags.join(", ")}` : "";

  return `You are a senior frontend engineering agent. Recreate the component or visual experience represented by the deployed preview below inside the user's current project.

Showcase title: ${input.title}
Preview URL: ${previewUrl}${sourceLine}${tagLine}

Context and constraints:
- The preview URL is the deployed project domain plus the asset route. It is not pasted source code.
- The available reference is limited to HTML, CSS, and JavaScript that can fully reproduce the visual result and interactions.
- Different showcases may have different HTML, CSS, and JavaScript sources, but the integration structure should remain consistent.
- Before implementing, inspect the user's current project architecture, technology stack, directory boundaries, component patterns, styling system, and existing utilities.
- Adapt the implementation to the user's project instead of copying the raw page structure directly.
- If any requirement, interaction, data source, integration target, or technical constraint is unclear, stop and ask the user for clarification before proceeding.

Implementation requirements:
1. Analyze the preview and infer the reusable structure, styling, assets, states, and key interactions needed to reproduce it.
2. Implement the result using the current project's stack, conventions, component abstractions, styling tokens, and utility APIs.
3. Keep the solution maintainable, reusable, accessible, and testable.
4. Avoid introducing new dependencies unless the existing project stack cannot reasonably support the implementation.
5. When multiple files are changed, explain each file's responsibility and provide a concise validation plan.`;
}
