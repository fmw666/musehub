export const showcaseUploadInterfaceName = "musehub.communityShowcase.upload.v1";

/**
 * Files that every showcase directory must contain at minimum. A showcase
 * may also ship additional sibling stylesheets (`*.css`), scripts
 * (`*.js` / `*.mjs`), and video media (`*.mp4` / `*.webm`) — see ADR 0003.
 */
export const showcaseUploadCoreFiles = ["index.html", "metadata.json"] as const;

export const showcaseUploadStylesheetExtensions = [".css"] as const;
export const showcaseUploadScriptExtensions = [".js", ".mjs"] as const;
export const showcaseUploadMediaExtensions = [".mp4", ".webm"] as const;

export const showcaseUploadAllowedAssetExtensions = [
  ...showcaseUploadStylesheetExtensions,
  ...showcaseUploadScriptExtensions,
  ...showcaseUploadMediaExtensions,
] as const;

/**
 * Total number of files allowed under a single showcase directory, counting
 * `index.html`, `metadata.json`, and every shipped asset.
 */
export const showcaseUploadMaxFileCount = 10;

/**
 * Per-file size cap (5 MiB). Applies uniformly to `index.html`,
 * `metadata.json`, and every shipped CSS / JS / media sibling.
 */
export const showcaseUploadMaxFileBytes = 5 * 1024 * 1024;

export const showcaseUploadEnvironments = [
  "vanilla",
  "react",
  "vue",
  "svelte",
  "solid",
  "angular",
] as const;

export const showcaseUploadRoot = "public/community-showcases";

export const showcaseUploadZipsRoot = "public/community-zips";

export const showcaseUploadSkillPath = "/upload/skill.md";

export const showcaseUploadCsp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
