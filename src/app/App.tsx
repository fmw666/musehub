import { siteConfig } from "@/app/config/site";
import { showcaseItems } from "@/entities/showcase/model/showcase-items";
import { ReferenceComposer } from "@/features/collect-reference/ui/ReferenceComposer";
import { GalleryWall } from "@/features/gallery-wall/ui/GalleryWall";
import { AppShell } from "@/widgets/app-shell/ui/AppShell";
import { StageMeta } from "@/widgets/app-shell/ui/StageMeta";

export default function App() {
  return (
    <AppShell>
      <section className="community-stage" aria-label={`${siteConfig.name} community feed`}>
        <StageMeta />
        <GalleryWall items={showcaseItems} />
        <ReferenceComposer />
      </section>
    </AppShell>
  );
}
