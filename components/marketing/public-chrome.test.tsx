import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/auth/browser", () => ({
  createBrowserSupabaseClient: () => null,
}));

import { PublicChrome } from "@/components/marketing/public-chrome";

describe("PublicChrome", () => {
  it("keeps page children in the first HTML, not behind a header-only Suspense fallback", () => {
    const html = renderToStaticMarkup(
      <PublicChrome>
        <h1>Send invoices. Get paid.</h1>
      </PublicChrome>,
    );
    expect(html).toContain("Send invoices. Get paid.");
    expect(html).toContain("Create Invoice");
  });
});
