import type { ShowcaseItem } from "@/entities/showcase/model/types";

type WallArtworkProps = {
  item: ShowcaseItem;
};

export function WallArtwork({ item }: WallArtworkProps) {
  if (item.assetPath) {
    return (
      <div className="wall-art wall-art-embed">
        <iframe
          src={item.assetPath}
          title={`${item.title} preview`}
          loading="lazy"
          sandbox="allow-scripts"
        />
      </div>
    );
  }

  return (
    <div className={`wall-art wall-art-${item.tone}`}>
      <div className="art-chrome" />
      <span />
      <i />
      <b />
    </div>
  );
}
