import { siteConfig } from "@/app/config/site";
import { getPageByPath, type RegisteredPage } from "@/app/routing/page-registry";
import { useCurrentPage } from "@/app/routing/use-current-page";
import { showcaseItems } from "@/entities/showcase/model/showcase-items";
import { ReferenceComposer } from "@/features/collect-reference/ui/ReferenceComposer";
import { GalleryWall } from "@/features/gallery-wall/ui/GalleryWall";
import { PagePlaceholder } from "@/shared/ui/PagePlaceholder";
import { AppShell } from "@/widgets/app-shell/ui/AppShell";
import { StageMeta } from "@/widgets/app-shell/ui/StageMeta";

export default function App() {
  const { currentPage, navigate } = useCurrentPage();

  return (
    <AppShell
      activePageId={currentPage.id}
      onNavigate={(item) => {
        navigate(getPageByPath(item.path));
      }}
    >
      <CurrentPage page={currentPage} />
    </AppShell>
  );
}

type CurrentPageProps = {
  page: RegisteredPage;
};

function CurrentPage({ page }: CurrentPageProps) {
  if (page.id !== "community") {
    return <PagePlaceholder page={page} />;
  }

  return (
    <section className="community-stage" aria-label={`${siteConfig.name} community feed`}>
      <StageMeta page={page} />
      <GalleryWall items={showcaseItems} />
      <ReferenceComposer />
    </section>
  );
}
