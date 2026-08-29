import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InvoiceTimeline } from "@/components/dashboard/invoice-timeline";

describe("InvoiceTimeline", () => {
  it("keeps status labels in document flow next to a per-row stem", () => {
    const html = renderToStaticMarkup(
      <InvoiceTimeline
        events={[
          { kind: "viewed", title: "Invoice Viewed", date: "2026-08-29" },
          { kind: "sent", title: "Invoice Sent", date: "2026-08-29" },
          { kind: "created", title: "Invoice Created", date: "2026-08-29" },
        ]}
      />,
    );
    expect(html).toContain("puyer-timeline");
    expect(html).toContain("puyer-timeline-stem");
    expect(html).toContain("grid-cols-[1.75rem_minmax(0,1fr)]");
    expect(html).not.toContain("translateX");
    expect(html).toContain("Invoice Viewed");
  });
});
