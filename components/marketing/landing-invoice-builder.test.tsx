import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingInvoiceBuilder } from "@/components/marketing/landing-invoice-builder";

describe("LandingInvoiceBuilder", () => {
  it("is a Client Component so next/dynamic can use ssr: false", () => {
    const source = readFileSync(join(process.cwd(), "components/marketing/landing-invoice-builder.tsx"), "utf8");
    expect(source).toMatch(/^"use client";/);
    expect(source).toContain("ssr: false");
  });

  it("is not imported via next/dynamic from the Server Component landing page", () => {
    const page = readFileSync(join(process.cwd(), "components/marketing/landing-page.tsx"), "utf8");
    expect(page).not.toContain("ssr: false");
    expect(page).toContain("LandingInvoiceBuilder");
  });

  it("renders the #builder placeholder on the server", () => {
    const html = renderToStaticMarkup(<LandingInvoiceBuilder />);
    expect(html).toContain('id="builder"');
    expect(html).toContain("aria-busy");
  });
});
