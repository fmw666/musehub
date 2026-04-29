export const showcaseUploadInterfaceName = "musehub.communityShowcase.upload.v1";

export const showcaseUploadRequiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "metadata.json",
] as const;

export const showcaseUploadRoot = "public/community-showcases";

export const showcaseUploadSkillPath = "/upload/skill.md";

export const showcaseUploadCsp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
