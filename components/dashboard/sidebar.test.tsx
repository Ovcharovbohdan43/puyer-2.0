import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

import { Sidebar } from "@/components/dashboard/sidebar";

describe("Sidebar", () => {
  it("renders Phosphor nav labels and the New Invoice CTA", () => {
    const html = renderToStaticMarkup(<Sidebar displayName="Ada Lovelace" plan="FREE" />);

    expect(html).toContain("Home");
    expect(html).toContain("Clients");
    expect(html).toContain("Invoices");
    expect(html).toContain("Payments");
    expect(html).toContain("Reports");
    expect(html).toContain("Settings");
    expect(html).toContain("Team");
    expect(html).toContain("Notifications");
    expect(html).toContain("New Invoice");
    expect(html).toContain("Sign out");
    expect(html).toContain("/invoices/new");
    expect(html).toContain("dash-sidebar");
    expect(html).not.toContain("/app/theme.svg");
    expect(html).not.toContain("/app/kpi-revenue.svg");
  });

  it("keeps a long display name inside the rail", () => {
    const html = renderToStaticMarkup(
      <Sidebar displayName={"n".repeat(80)} plan="FREE" />,
    );
    expect(html).toContain("max-w-[260px]");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("truncate");
  });

  it("paints the top wash from globals.css, not a Tailwind arbitrary background", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
    expect(css).toContain(".dash-sidebar");
    expect(css).toContain("radial-gradient");
    expect(css).toContain("108 248 187");
  });
});
