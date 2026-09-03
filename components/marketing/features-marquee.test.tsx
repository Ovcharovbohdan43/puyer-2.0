import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FeaturesMarquee, landingFeatureCards } from "@/components/marketing/features-marquee";

describe("FeaturesMarquee", () => {
  it("duplicates the four feature cards for a seamless horizontal loop", () => {
    const cards = landingFeatureCards({
      createTitle: "Create professional invoices",
      createBody: "Easily build invoices that look great and reflect your brand.",
      sendTitle: "Send them in seconds",
      sendBody: "Deliver via email or direct link instantly.",
      trackTitle: "Track when you're paid",
      trackBody: "Know exactly when a client views or pays your invoice.",
      remindTitle: "Automate payment reminders",
      remindBody: "Stop chasing clients. We handle the follow-ups.",
    });
    const html = renderToStaticMarkup(<FeaturesMarquee cards={cards} />);

    expect(html).toContain("features-marquee-track");
    expect(html).toContain('aria-hidden="true"');
    expect(html.split("Create professional invoices").length - 1).toBe(2);
    expect(html.split("Send them in seconds").length - 1).toBe(2);
  });
});

describe("landing marquee CSS", () => {
  it("does not pause feature or Why marquees on hover", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).not.toContain(".features-marquee:hover .features-marquee-track");
    expect(css).not.toContain(".why-marquee-stack:hover .features-marquee-track");
  });
});
