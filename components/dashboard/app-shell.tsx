"use client";

import type { ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

type AppShellProps = {
  displayName: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  children: ReactNode;
};

export function AppShell({ displayName, plan, children }: AppShellProps) {
  return (
    <div className="app-shell min-h-dvh bg-[#0B1320] text-[#F8F9FF]">
      <Sidebar displayName={displayName} plan={plan} />
      <div className="min-h-dvh lg:pl-[280px]">
        <div className="pb-16 lg:pb-0">{children}</div>
      </div>
      <MobileTabBar />
    </div>
  );
}
