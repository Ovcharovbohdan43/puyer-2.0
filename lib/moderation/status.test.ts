import { describe, expect, it } from "vitest";

import { banNoticeSubject, banNoticeText } from "@/lib/moderation/notice";
import { clipBanReason, isBanInForce, isUsableBanReason } from "@/lib/moderation/status";

describe("isBanInForce", () => {
  it("treats an active permanent ban as in force", () => {
    expect(
      isBanInForce({
        kind: "PERMANENT",
        status: "ACTIVE",
        reason: "Terms of Service violation involving abuse of invoicing.",
        endsAt: null,
      }),
    ).toBe(true);
  });

  it("ignores a lifted or expired temporary ban", () => {
    expect(
      isBanInForce({
        kind: "TEMPORARY",
        status: "LIFTED",
        reason: "Terms of Service violation involving abuse of invoicing.",
        endsAt: new Date("2099-01-01T00:00:00.000Z"),
      }),
    ).toBe(false);
    expect(
      isBanInForce(
        {
          kind: "TEMPORARY",
          status: "ACTIVE",
          reason: "Terms of Service violation involving abuse of invoicing.",
          endsAt: new Date("2020-01-01T00:00:00.000Z"),
        },
        new Date("2026-08-30T00:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("requires a usable stored reason", () => {
    expect(isUsableBanReason("short")).toBe(false);
    expect(isUsableBanReason("  Abuse of invoicing to send spam.  ")).toBe(true);
    expect(clipBanReason("  two   spaces  ")).toBe("two spaces");
  });
});

describe("ban notice", () => {
  it("includes the stored reason and next steps", () => {
    const text = banNoticeText({
      recipientName: "Ada",
      kind: "TEMPORARY",
      reason: "Repeated Terms of Service violations on invoice spam.",
      endsAt: new Date("2026-09-15T00:00:00.000Z"),
      helpUrl: "https://puyer.org/help",
      supportEmail: "support@puyer.org",
    });
    expect(banNoticeSubject("TEMPORARY")).toContain("temporarily restricted");
    expect(text).toContain("Repeated Terms of Service violations on invoice spam.");
    expect(text).toContain("2026-09-15");
    expect(text).toContain("support@puyer.org");
    expect(text).toContain("https://puyer.org/help");
  });
});
