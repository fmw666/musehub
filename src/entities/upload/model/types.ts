export type UploadSourceType = "url" | "image" | "repository" | "prompt";

export type UploadDraft = {
  id: string;
  sourceType: UploadSourceType;
  title?: string;
  sourceValue?: string;
  tags: readonly string[];
  createdAt: string;
};
