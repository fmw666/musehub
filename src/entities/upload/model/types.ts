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

export type ShowcaseUploadMetadata = {
  id: string;
  title: string;
  tags: readonly string[];
  sourceUrl: string;
  sourcePlatform: string;
  originalFile: string;
  assetPath: string;
  importedAt: string;
  files: {
    "index.html": ShowcaseUploadFileIntegrity;
    "styles.css": ShowcaseUploadFileIntegrity;
    "script.js": ShowcaseUploadFileIntegrity;
  };
};

export type ShowcaseUploadFileIntegrity = {
  sha256: string;
  bytes: number;
};
