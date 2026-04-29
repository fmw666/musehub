export type ContentKind = "showcase" | "repository" | "prompt" | "screenshot" | "article";

export type ContentSource = {
  type: "url" | "repository" | "upload" | "manual";
  label: string;
  href?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  summary: string;
  kind: ContentKind;
  source: ContentSource;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
};
