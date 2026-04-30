import { showcaseItems } from "@/entities/showcase/model/showcase-items";
import { GalleryWall } from "@/features/gallery-wall/ui/GalleryWall";
import type { PageContract } from "@/shared/contracts/page";
import { StageMeta } from "@/widgets/app-shell/ui/StageMeta";

type CommunityPageProps = {
  page: PageContract;
  siteName: string;
};

export function CommunityPage({ page, siteName }: CommunityPageProps) {
  return (
    <section className="community-stage" aria-label={`${siteName} community feed`}>
      <StageMeta page={page} />
      <GalleryWall items={showcaseItems} />
    </section>
  );
}
