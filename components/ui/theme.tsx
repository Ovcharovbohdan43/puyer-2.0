"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import { parseStoredTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => undefined });

let currentTheme: Theme = "light";
const listeners = new Set<() => void>();

function readStoredTheme(): Theme {
  return parseStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(next: Theme) {
  currentTheme = next;
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
  emit();
}

export function restoreStoredTheme() {
  applyTheme(readStoredTheme());
}

export function forceLightDocument() {
  document.documentElement.dataset.theme = "light";
  document.documentElement.style.colorScheme = "light";
}

if (typeof window !== "undefined") {
  currentTheme = readStoredTheme();
  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.style.colorScheme = currentTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    applyTheme(currentTheme === "light" ? "dark" : "light");
  }, []);

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
