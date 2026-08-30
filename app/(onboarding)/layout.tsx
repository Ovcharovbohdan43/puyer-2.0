"use client";

import { useEffect, type ReactNode } from "react";

import { forceLightDocument, restoreStoredTheme } from "@/components/ui/theme";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    forceLightDocument();
    return () => {
      restoreStoredTheme();
    };
  }, []);

  return children;
}
