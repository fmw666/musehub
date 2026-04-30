export type ShowcaseTone = "mint" | "fan" | "void" | "postal" | "phone" | "stack";

export type ShowcaseItem = {
  id: string;
  title: string;
  source: string;
  kind: string;
  tone: ShowcaseTone;
  span: "hero" | "wide" | "medium" | "tall" | "compact";
  status: "featured" | "new" | "archived";
  tags?: readonly string[];
  sourceUrl?: string;
  sourcePlatform?: string;
  assetPath?: string;
  prompt?: string;
  zipPath?: string;
  linkUrl?: string;
  favorites?: number;
  likes?: number;
  preview?: {
    width: number;
    height: number;
    displayWidth?: number;
  };
};
