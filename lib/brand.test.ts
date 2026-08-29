import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PUYER_FAVICON_SRC, PUYER_LOGO_SRC, puyerLogoAbsoluteUrl } from "@/lib/brand";

describe("Puyer brand mark", () => {
  it("ships a transparent lockup PNG", () => {
    const file = join(process.cwd(), "public", "brand", "puyer-logo.png");
    expect(existsSync(file)).toBe(true);
    const png = readFileSync(file);
    expect(png.subarray(0, 8).toString("binary")).toBe("\x89PNG\r\n\x1a\n");
    expect(png[25]).toBe(6);
  });

  it("ships a square transparent favicon PNG", () => {
    expect(PUYER_FAVICON_SRC).toBe("/brand/puyer-favicon.png");
    const file = join(process.cwd(), "public", "brand", "puyer-favicon.png");
    expect(existsSync(file)).toBe(true);
    const png = readFileSync(file);
    expect(png.subarray(0, 8).toString("binary")).toBe("\x89PNG\r\n\x1a\n");
    expect(png[25]).toBe(6);
    expect(existsSync(join(process.cwd(), "app", "icon.svg"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "apple-icon.png"))).toBe(true);
  });

  it("builds an absolute logo URL from APP_URL", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://puyer.org";
    expect(puyerLogoAbsoluteUrl()).toBe(`https://puyer.org${PUYER_LOGO_SRC}`);
    process.env.NEXT_PUBLIC_APP_URL = previous;
  });
});
