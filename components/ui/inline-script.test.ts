import { describe, expect, it, vi } from "vitest";

import { inlineScriptType } from "@/components/ui/inline-script";

describe("inlineScriptType", () => {
  it("is javascript during SSR (no window) so the theme bootstrap runs before paint", () => {
    expect(inlineScriptType()).toBe("text/javascript");
  });

  it("is plain after hydration so React does not treat it as an executable script", () => {
    vi.stubGlobal("window", {});
    expect(inlineScriptType()).toBe("text/plain");
    vi.unstubAllGlobals();
  });
});
