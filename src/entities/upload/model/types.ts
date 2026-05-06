export type UploadSourceType = "url" | "image" | "repository" | "prompt" | "showcase";
export type UploadMethod = "agent-skill";

export type UploadDraft = {
  id: string;
  sourceType: UploadSourceType;
  method?: UploadMethod;
  title?: string;
  sourceValue?: string;
  tags: readonly string[];
  createdAt: string;
};

export type ShowcaseUploadEnvironment =
  | "vanilla"
  | "react"
  | "vue"
  | "svelte"
  | "solid"
  | "angular";

export type ShowcaseUploadFileIntegrity = {
  sha256: string;
  bytes: number;
};

export type ShowcaseUploadAssets = {
  html: "index.html";
  styles: readonly string[];
  scripts: readonly string[];
};

/**
 * Same flexibility rationale as `ShowcaseDownloadKind` in the showcase entity:
 * the canonical kinds are the known environments, but a showcase may publish
 * bespoke variant names (e.g. "minimal").
 */
export type ShowcaseUploadDownloadKind = ShowcaseUploadEnvironment | (string & {});

export type ShowcaseUploadDownload = {
  kind: ShowcaseUploadDownloadKind;
  label: string;
  url: string;
  description?: string;
};

/**
 * Metadata payload an agent must produce for a community showcase upload.
 *
 * The shape is intentionally extensible: a showcase always has a single
 * `index.html` entry, but it can ship any number of stylesheet and script
 * siblings (each tracked under `files`), declare a target `environment`,
 * and offer multiple downloadable ZIP variants under `downloads`. See
 * ADR 0003 for the rationale.
 */
export type ShowcaseUploadMetadata = {
  id: string;
  title: string;
  tags: readonly string[];
  sourceUrl: string;
  sourcePlatform: string;
  originalFile: string;
  assetPath: string;
  importedAt: string;
  environment?: ShowcaseUploadEnvironment;
  assets?: ShowcaseUploadAssets;
  downloads?: readonly ShowcaseUploadDownload[];
  files: Readonly<Record<string, ShowcaseUploadFileIntegrity>>;
};
