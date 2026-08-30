"use client";

import { PublicHeader } from "@/components/marketing/public-header";
import { SiteFooter } from "@/components/legal/site-footer";
import { PublicSession } from "@/components/invoice-builder/builder-session";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell">
      <PublicSession>
        <PublicHeader />
        {children}
        <SiteFooter />
      </PublicSession>
    </div>
  );
}
