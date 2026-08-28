"use client";

import { useTheme } from "@/components/ui/theme";
import { t } from "@/lib/i18n";

export function ThemeToggle() {
  const copy = t("header");
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-10 items-center justify-center rounded-full border border-puyer-border text-foreground transition-colors hover:bg-puyer-soft"
      aria-label={isDark ? copy.themeLight : copy.themeDark}
      aria-pressed={isDark}
      title={isDark ? copy.themeLight : copy.themeDark}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.3A8.4 8.4 0 0 1 9.7 3 7.2 7.2 0 1 0 21 14.3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3v1.6M12 19.4V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.6M19.4 12H21M4.9 19.1 6 18M18 6l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
