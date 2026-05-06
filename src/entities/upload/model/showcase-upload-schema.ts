export const showcaseUploadInterfaceName = "musehub.communityShowcase.upload.v1";

/**
 * Files that every showcase directory must contain at minimum. A showcase
 * may also ship any number of additional sibling stylesheets (`*.css`) and
 * scripts (`*.js` / `*.mjs`) — see ADR 0003.
 */
export const showcaseUploadCoreFiles = ["index.html", "metadata.json"] as const;

export const showcaseUploadAllowedAssetExtensions = [".css", ".js", ".mjs"] as const;

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
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
