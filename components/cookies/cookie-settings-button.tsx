"use client";

import { openCookiePreferences } from "@/lib/cookies/consent";
import { t } from "@/lib/i18n";

export function CookieSettingsButton({ className }: { className?: string }) {
  const label = t("footer").cookieSettings;
  return (
    <button type="button" className={className} onClick={() => openCookiePreferences()}>
      {label}
    </button>
  );
}
