"use client";

import { Suspense } from "react";

import { PublicHeader } from "@/components/marketing/public-header";
import { PublicSession } from "@/components/invoice-builder/builder-session";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<header className="public-header sticky top-0 z-40 h-16 border-b border-[#e2e8f0]" />}>
      <PublicSession>
        <PublicHeader />
        {children}
      </PublicSession>
    </Suspense>
  );
}
