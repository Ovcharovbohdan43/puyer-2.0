import { describe, expect, it } from "vitest";

import { floodClearBackground, knockoutCornerBackground } from "@/lib/invoices/logo-bg";
import { clampLogoScale, invoiceLogoHeightPx, sanitizeStoredLogoUrl } from "@/lib/invoices/logo";

describe("logo scale and URL", () => {
  it("clamps display scale and rejects non-https URLs", () => {
    expect(clampLogoScale(12)).toBe(40);
    expect(clampLogoScale(400)).toBe(160);
    expect(invoiceLogoHeightPx(100)).toBe(56);
    expect(sanitizeStoredLogoUrl("https://cdn.example/logo.png")).toBe("https://cdn.example/logo.png");
    expect(sanitizeStoredLogoUrl("blob:https://puyer.org/abc")).toBe("");
    expect(sanitizeStoredLogoUrl("javascript:alert(1)")).toBe("");
  });
});

describe("knockoutCornerBackground", () => {
  it("clears a white plate around a dark mark", () => {
    const width = 8;
    const height = 8;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < data.length; index += 4) {
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = 255;
    }
    const mid = (4 * width + 4) * 4;
    data[mid] = 0;
    data[mid + 1] = 80;
    data[mid + 2] = 40;
    expect(knockoutCornerBackground(data, width, height, 20)).toBe(true);
    expect(data[3]).toBe(0);
    expect(data[mid + 3]).toBe(255);
  });
});

describe("floodClearBackground", () => {
  it("clears the connected white plate and keeps the mark", () => {
    const width = 8;
    const height = 8;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < data.length; index += 4) {
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = 255;
    }
    const mid = (4 * width + 4) * 4;
    data[mid] = 0;
    data[mid + 1] = 80;
    data[mid + 2] = 40;
    expect(floodClearBackground(data, width, height, 20)).toBe(true);
    expect(data[3]).toBe(0);
    expect(data[mid + 3]).toBe(255);
  });
});
