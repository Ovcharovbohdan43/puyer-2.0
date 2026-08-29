"use client";

import { CookieConsent } from "@/components/cookies/cookie-consent";
import { ThemeProvider } from "@/components/ui/theme";
import { ToastProvider } from "@/components/ui/toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <CookieConsent />
      </ToastProvider>
    </ThemeProvider>
  );
}
