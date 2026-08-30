import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingBuilderPlaceholder } from "@/components/marketing/landing-builder-placeholder";

describe("LandingBuilderPlaceholder", () => {
  it("reserves the builder slot so Create Invoice can scroll before the form hydrates", () => {
    const html = renderToStaticMarkup(<LandingBuilderPlaceholder />);
    expect(html).toContain('id="builder"');
    expect(html).toContain("aria-busy");
    expect(html).toContain("min-h-[600px]");
  });
});
