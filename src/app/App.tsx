import { type ReactNode, useCallback } from "react";

import { siteConfig } from "@/app/config/site";
import { getPageByPath, type RegisteredPage } from "@/app/routing/page-registry";
import { routePaths } from "@/app/routing/route-paths";
import { useCurrentPage } from "@/app/routing/use-current-page";
import { useRouteTransition } from "@/app/routing/use-route-transition";
import { CommunityPage } from "@/pages/community/ui/CommunityPage";
import { HomePage } from "@/pages/home/ui/HomePage";
import { DissolveTransition } from "@/shared/ui/DissolveTransition";
import { PagePlaceholder } from "@/shared/ui/PagePlaceholder";
import { AppShell } from "@/widgets/app-shell/ui/AppShell";

const homeDissolveDurationMs = 1120;

export default function App() {
  const { currentPage, navigate } = useCurrentPage();
  const { clearTransition, isTransitionActive, startTransition } = useRouteTransition();

  const isHomeToCommunityTransition = isTransitionActive("home-to-community");

  const enterCommunity = useCallback(() => {
    startTransition("home-to-community");
    navigate(getPageByPath(routePaths.community));
  }, [navigate, startTransition]);

  const renderHomePage = (options?: { isDissolving?: boolean; isInteractive?: boolean }) => (
    <HomePage
      communityPath={routePaths.community}
      description={siteConfig.description}
      isDissolving={options?.isDissolving}
      isInteractive={options?.isInteractive}
      title={siteConfig.name}
      onEnterCommunity={enterCommunity}
    />
  );

  return (
    <AppShell
      activePageId={currentPage.id}
      isRailRevealing={isHomeToCommunityTransition}
      showPrimaryNavigation={currentPage.id !== "home"}
      onNavigate={(item) => {
        clearTransition();
        navigate(getPageByPath(item.path));
      }}
    >
      <div className="page-transition-frame" data-page-id={currentPage.id} key={currentPage.id}>
        <CurrentPage page={currentPage} renderHomePage={renderHomePage} />
      </div>
      <DissolveTransition
        className="home-transition-layer"
        durationMs={homeDissolveDurationMs}
        isActive={isHomeToCommunityTransition}
        onExited={clearTransition}
      >
        {renderHomePage({ isDissolving: true, isInteractive: false })}
      </DissolveTransition>
    </AppShell>
  );
}

type CurrentPageProps = {
  page: RegisteredPage;
  renderHomePage: (options?: { isDissolving?: boolean; isInteractive?: boolean }) => ReactNode;
};

function CurrentPage({ page, renderHomePage }: CurrentPageProps) {
  if (page.id === "home") {
    return renderHomePage();
  }

  if (page.id !== "community") {
    return <PagePlaceholder page={page} />;
  }

  return <CommunityPage page={page} siteName={siteConfig.name} />;
}
