"use client";

import { Suspense } from "react";

import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/legal/site-footer";
import { PublicSession } from "@/components/invoice-builder/builder-session";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell">
      <Suspense fallback={<header className="public-header sticky top-0 z-40 h-16 border-b border-[#e2e8f0]" />}>
        <PublicSession>
          <PublicHeader />
          {children}
          <SiteFooter />
        </PublicSession>
      </Suspense>
    </div>
  );
}
