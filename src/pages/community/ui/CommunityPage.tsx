import { showcaseItems } from "@/entities/showcase/model/showcase-items";
import { GalleryWall } from "@/features/gallery-wall/ui/GalleryWall";

type CommunityPageProps = {
  siteName: string;
};

export function CommunityPage({ siteName }: CommunityPageProps) {
  return (
    <section className="community-stage" aria-label={`${siteName} community feed`}>
      <GalleryWall items={showcaseItems} />
    </section>
  );
}
