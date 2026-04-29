import type { ReactNode } from "react";

import type { PrimaryNavigationItem } from "@/app/navigation/primary-navigation";

import { SideRail } from "./SideRail";

type AppShellProps = {
  activePageId: PrimaryNavigationItem["id"];
  children: ReactNode;
  isRailRevealing?: boolean;
  onNavigate: (item: PrimaryNavigationItem) => void;
  showPrimaryNavigation?: boolean;
};

export function AppShell({
  activePageId,
  children,
  isRailRevealing = false,
  onNavigate,
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
        showPrimaryNavigation={showPrimaryNavigation}
      />
      {children}
    </main>
  );
}
