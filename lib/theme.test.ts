import { describe, expect, it } from "vitest";

import { parseStoredTheme, THEME_BOOTSTRAP_SCRIPT, THEME_STORAGE_KEY } from "@/lib/theme";

describe("THEME_BOOTSTRAP_SCRIPT", () => {
  it("reads the same storage key as ThemeProvider", () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain(THEME_STORAGE_KEY);
    expect(THEME_BOOTSTRAP_SCRIPT).toContain("dataset.theme");
    expect(THEME_BOOTSTRAP_SCRIPT).toContain("colorScheme");
  });
});

describe("parseStoredTheme", () => {
  it("accepts light and dark", () => {
    expect(parseStoredTheme("light")).toBe("light");
    expect(parseStoredTheme("dark")).toBe("dark");
  });

  it("falls back to light for missing or unknown values", () => {
    expect(parseStoredTheme(null)).toBe("light");
    expect(parseStoredTheme("system")).toBe("light");
    expect(parseStoredTheme("")).toBe("light");
  });
});
