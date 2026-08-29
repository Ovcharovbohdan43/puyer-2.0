"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type AppShellProps = {
  displayName: string;
  plan: "FREE" | "PRO" | "BUSINESS";
  children: ReactNode;
};

export function AppShell({ displayName, plan, children }: AppShellProps) {
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
  }, []);

  return (
    <div className="app-shell min-h-dvh bg-[#F6F7F6] text-[#111827]">
      <Sidebar displayName={displayName} plan={plan} />
      <div className="min-h-dvh lg:pl-[260px]">
        <div className="pb-16 lg:pb-0">{children}</div>
      </div>
      <MobileTabBar />
    </div>
  );
}
