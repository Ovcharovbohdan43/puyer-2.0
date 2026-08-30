import { describe, expect, it } from "vitest";

import {
  billingNoticeCopy,
  billingNoticeKind,
  emailChangeRequestedCopy,
  passwordChangedCopy,
  planDisplayName,
} from "@/lib/email/lifecycle";

describe("billingNoticeKind", () => {
  it("emails when a workspace first lands on Pro or Business", () => {
    expect(
      billingNoticeKind(null, { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: false }),
    ).toBe("activated");
    expect(
      billingNoticeKind(
        { plan: "FREE", status: "INCOMPLETE", cancelAtPeriodEnd: false },
        { plan: "BUSINESS", status: "ACTIVE", cancelAtPeriodEnd: false },
      ),
    ).toBe("activated");
  });

  it("does not email a routine invoice.paid on the same plan", () => {
    expect(
      billingNoticeKind(
        { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: false },
        { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: false },
      ),
    ).toBeNull();
  });

  it("emails plan changes, scheduled cancel, cancel, and failed renewal", () => {
    expect(
      billingNoticeKind(
        { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: false },
        { plan: "BUSINESS", status: "ACTIVE", cancelAtPeriodEnd: false },
      ),
    ).toBe("plan_changed");
    expect(
      billingNoticeKind(
        { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: false },
        { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: true },
      ),
    ).toBe("cancel_scheduled");
    expect(
      billingNoticeKind(
        { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: true },
        { plan: "FREE", status: "CANCELED", cancelAtPeriodEnd: false },
      ),
    ).toBe("canceled");
    expect(
      billingNoticeKind(
        { plan: "PRO", status: "ACTIVE", cancelAtPeriodEnd: false },
        { plan: "PRO", status: "PAST_DUE", cancelAtPeriodEnd: false },
      ),
    ).toBe("payment_failed");
  });
});

describe("lifecycle copy", () => {
  it("names Pro and Business in subscription mail", () => {
    expect(planDisplayName("PRO")).toBe("Pro");
    const activated = billingNoticeCopy({
      kind: "activated",
      plan: "PRO",
      recipientName: "Ada",
      workspaceName: "Ada Ltd",
      billingUrl: "https://www.puyer.org/billing",
      supportEmail: "support@puyer.org",
    });
    expect(activated.subject).toContain("Pro");
    expect(activated.paragraphs.join(" ")).toContain("Ada Ltd");
    expect(passwordChangedCopy({
      recipientName: "Ada",
      settingsUrl: "https://www.puyer.org/settings",
      supportEmail: "support@puyer.org",
    }).subject).toContain("password");
    expect(
      emailChangeRequestedCopy({
        recipientName: "Ada",
        newEmail: "new@example.com",
        settingsUrl: "https://www.puyer.org/settings",
        supportEmail: "support@puyer.org",
      }).paragraphs.join(" "),
    ).toContain("new@example.com");
  });
});
