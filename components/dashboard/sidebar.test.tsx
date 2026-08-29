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
    expect(html).not.toContain("/app/theme.svg");
    expect(html).not.toContain("/app/kpi-revenue.svg");
  });
});
