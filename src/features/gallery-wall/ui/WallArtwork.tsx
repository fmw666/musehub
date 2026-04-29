import type { ShowcaseTone } from "@/entities/showcase/model/types";

type WallArtworkProps = {
  tone: ShowcaseTone;
};

export function WallArtwork({ tone }: WallArtworkProps) {
  return (
    <div className={`wall-art wall-art-${tone}`}>
      <div className="art-chrome" />
      <span />
      <i />
      <b />
    </div>
  );
}
