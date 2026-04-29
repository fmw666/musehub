import type { ReactNode } from "react";

import { SideRail } from "./SideRail";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="community-shell min-h-screen bg-black text-white">
      <SideRail />
      {children}
    </main>
  );
}
