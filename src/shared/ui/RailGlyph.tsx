import { Bookmark, Compass, Folder, SquarePen, type LucideIcon } from "lucide-react";

type RailGlyphProps = {
  name: RailGlyphName;
};

export type RailGlyphName = "compose" | "compass" | "folder" | "bookmark";

const railGlyphs = {
  compose: SquarePen,
  compass: Compass,
  folder: Folder,
  bookmark: Bookmark,
} satisfies Record<RailGlyphName, LucideIcon>;

export function RailGlyph({ name }: RailGlyphProps) {
  const Icon = railGlyphs[name];

  return <Icon className="rail-glyph" aria-hidden="true" />;
}
