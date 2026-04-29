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
};
