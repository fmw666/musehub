import { type ReactNode, Suspense, lazy, useCallback } from "react";

import { siteConfig } from "@/app/config/site";
import { getPageByPath, type RegisteredPage } from "@/app/routing/page-registry";
import { routePaths } from "@/app/routing/route-paths";
import { useCurrentPage } from "@/app/routing/use-current-page";
import { useRouteTransition } from "@/app/routing/use-route-transition";
import { AuthProvider, RequireAuth } from "@/features/auth";
import { HomePage } from "@/pages/home/ui/HomePage";
import { DissolveTransition } from "@/shared/ui/DissolveTransition";
import { PagePlaceholder } from "@/shared/ui/PagePlaceholder";
import { AppShell } from "@/widgets/app-shell/ui/AppShell";

const CommunityPage = lazy(() =>
  import("@/pages/community/ui/CommunityPage").then((module) => ({
    default: module.CommunityPage,
  })),
);
const UploadPage = lazy(() =>
  import("@/pages/upload/ui/UploadPage").then((module) => ({ default: module.UploadPage })),
);
const SignInPage = lazy(() =>
  import("@/pages/sign-in/ui/SignInPage").then((module) => ({ default: module.SignInPage })),
);

const homeDissolveDurationMs = 1120;

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { currentPage, navigate } = useCurrentPage();
  const { clearTransition, isTransitionActive, startTransition } = useRouteTransition();

  const isHomeToCommunityTransition = isTransitionActive("home-to-community");

  const enterCommunity = useCallback(() => {
    startTransition("home-to-community");
    navigate(getPageByPath(routePaths.community));
  }, [navigate, startTransition]);

  const handleNavigatePath = useCallback(
    (path: string) => {
      clearTransition();
      navigate(getPageByPath(path));
    },
    [clearTransition, navigate],
  );

  const handleSignedIn = useCallback(() => {
    navigate(getPageByPath(routePaths.community));
  }, [navigate]);

  const redirectToSignIn = useCallback(
    (path: string) => {
      navigate(getPageByPath(path));
    },
    [navigate],
  );

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

  const showPrimaryNavigation = currentPage.id !== "home" && currentPage.id !== "sign-in";

  return (
    <AppShell
      activePageId={currentPage.id}
      isRailRevealing={isHomeToCommunityTransition}
      showPrimaryNavigation={showPrimaryNavigation}
      onNavigate={(item) => {
        clearTransition();
        navigate(getPageByPath(item.path));
      }}
      onNavigatePath={handleNavigatePath}
    >
      <div className="page-transition-frame" data-page-id={currentPage.id} key={currentPage.id}>
        <Suspense fallback={<PageLoadingFallback />}>
          <CurrentPage
            page={currentPage}
            renderHomePage={renderHomePage}
            onSignedIn={handleSignedIn}
            onRedirectToSignIn={redirectToSignIn}
          />
        </Suspense>
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
  onSignedIn: () => void;
  onRedirectToSignIn: (to: string) => void;
};

/*
 * Routes that require an authenticated session. Anonymous visitors are
 * bounced to `/sign-in` via `RequireAuth`. Community / Home / Sign-in
 * stay public so the marketing and discovery surfaces always render.
 */
const PROTECTED_PAGE_IDS = new Set<RegisteredPage["id"]>(["upload", "favorites", "repositories"]);

function CurrentPage({ page, renderHomePage, onSignedIn, onRedirectToSignIn }: CurrentPageProps) {
  if (page.id === "home") {
    return renderHomePage();
  }

  if (page.id === "sign-in") {
    return <SignInPage onAuthenticated={onSignedIn} />;
  }

  const body = renderPageBody(page);

  if (PROTECTED_PAGE_IDS.has(page.id)) {
    return (
      <RequireAuth onRedirect={onRedirectToSignIn} fallback={<PageLoadingFallback />}>
        {body}
      </RequireAuth>
    );
  }

  return body;
}

function renderPageBody(page: RegisteredPage): ReactNode {
  if (page.id === "upload") {
    return <UploadPage />;
  }
  if (page.id !== "community") {
    return <PagePlaceholder page={page} />;
  }
  return <CommunityPage siteName={siteConfig.name} />;
}

function PageLoadingFallback() {
  return <div className="page-loading-fallback" aria-hidden="true" />;
}
