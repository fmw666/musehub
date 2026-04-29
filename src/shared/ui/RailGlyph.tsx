type RailGlyphProps = {
  name: "orbit" | "spark" | "square" | "dots";
};

export function RailGlyph({ name }: RailGlyphProps) {
  return <span className={`rail-glyph rail-glyph-${name}`} aria-hidden="true" />;
}
