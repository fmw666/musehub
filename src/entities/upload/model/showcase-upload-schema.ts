export const showcaseUploadInterfaceName = "musehub.communityShowcase.upload.v1";

/**
 * Files that every showcase directory must contain at minimum. A showcase
 * may also ship additional sibling stylesheets (`*.css`), scripts
 * (`*.js` / `*.mjs`), and media — both video (`*.mp4`, `*.webm`) and image
 * (`*.png`, `*.webp`, `*.avif`, `*.svg`, `*.jpg`, `*.jpeg`) — see ADR 0003.
 */
export const showcaseUploadCoreFiles = ["index.html", "metadata.json"] as const;

export const showcaseUploadStylesheetExtensions = [".css"] as const;
export const showcaseUploadScriptExtensions = [".js", ".mjs"] as const;
export const showcaseUploadVideoExtensions = [".mp4", ".webm"] as const;
export const showcaseUploadImageExtensions = [
  ".png",
  ".webp",
  ".avif",
  ".svg",
  ".jpg",
  ".jpeg",
] as const;
export const showcaseUploadMediaExtensions = [
  ...showcaseUploadVideoExtensions,
  ...showcaseUploadImageExtensions,
] as const;

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

/**
 * Canonical upstream GitHub repository for MuseHub. Showcase pull requests
 * must target this repo's default branch (`main`). Surfaced to agents both
 * via `public/upload/skill.md` and via the upload workbench prompt so that
 * an agent reading either source knows where to push and where to open the
 * pull request.
 */
export const showcaseUploadRepositoryUrl = "https://github.com/fmw666/musehub";

export const showcaseUploadRepositoryDefaultBranch = "main";

export const showcaseUploadCsp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
