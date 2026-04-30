import type { ShowcaseItem } from "@/entities/showcase/model/types";

export function createShowcaseCopyPrompt(item: ShowcaseItem, origin: string) {
  const previewUrl = createAbsoluteUrl(item.linkUrl ?? item.assetPath, origin);
  if (!previewUrl) {
    return undefined;
  }

  const sourceLine = item.sourceUrl ? `\nSource project: ${item.sourceUrl}` : "";
  const tagLine = item.tags?.length ? `\nTags: ${item.tags.join(", ")}` : "";

  return `You are a senior frontend engineering agent. Recreate the component or visual experience represented by the deployed preview below inside the user's current project.

Showcase title: ${item.title}
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

function createAbsoluteUrl(pathOrUrl: string | undefined, origin: string) {
  if (!pathOrUrl) {
    return undefined;
  }

  return new URL(pathOrUrl, origin).toString();
}
