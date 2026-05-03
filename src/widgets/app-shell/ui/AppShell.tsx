import type { ReactNode } from "react";

import type { RegisteredPageId } from "@/app/routing/page-registry";
import type { PrimaryNavigationItem } from "@/app/navigation/primary-navigation";

import { SideRail } from "./SideRail";

type AppShellProps = {
  activePageId: RegisteredPageId;
  children: ReactNode;
  isRailRevealing?: boolean;
  onNavigate: (item: PrimaryNavigationItem) => void;
  onNavigatePath?: (path: string) => void;
  showPrimaryNavigation?: boolean;
};

export function AppShell({
  activePageId,
  children,
  isRailRevealing = false,
  onNavigate,
  onNavigatePath,
  showPrimaryNavigation = true,
}: AppShellProps) {
  const shellClassName = [
    "community-shell",
    activePageId === "home" ? "home-shell" : "",
    isRailRevealing ? "is-rail-revealing" : "",
    isRailRevealing ? "is-community-entering" : "",
    "min-h-screen bg-black text-white",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={shellClassName}>
      <SideRail
        activePageId={activePageId}
        onNavigate={onNavigate}
        onNavigatePath={onNavigatePath}
        showPrimaryNavigation={showPrimaryNavigation}
      />
      {children}
    </main>
  );
}
