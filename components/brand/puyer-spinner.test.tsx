import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PuyerBusyText, PuyerRouteLoading, PuyerSpinner } from "@/components/brand/puyer-spinner";

describe("PuyerSpinner", () => {
  it("exposes a branded loading status for screen readers", () => {
    const html = renderToStaticMarkup(<PuyerSpinner />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
    expect(html).toContain("puyer-spinner");
  });

  it("wraps busy copy and leaves idle copy as plain text", () => {
    expect(renderToStaticMarkup(<PuyerBusyText busy={false} busyLabel="Saving" idle="Save" />)).toBe("Save");
    const busy = renderToStaticMarkup(<PuyerBusyText busy busyLabel="Saving" idle="Save" />);
    expect(busy).toContain("Saving");
    expect(busy).toContain("puyer-spinner");
  });

  it("centers a full-route loader", () => {
    const html = renderToStaticMarkup(<PuyerRouteLoading />);
    expect(html).toContain("puyer-loading");
    expect(html).toContain("puyer-spinner");
  });
});
