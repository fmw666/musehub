import type { ReactNode } from "react";

import type { PrimaryNavigationItem } from "@/app/navigation/primary-navigation";

import { SideRail } from "./SideRail";

type AppShellProps = {
  activePageId: PrimaryNavigationItem["id"];
  children: ReactNode;
  onNavigate: (item: PrimaryNavigationItem) => void;
};

export function AppShell({ activePageId, children, onNavigate }: AppShellProps) {
  return (
    <main className="community-shell min-h-screen bg-black text-white">
      <SideRail activePageId={activePageId} onNavigate={onNavigate} />
      {children}
    </main>
  );
}
