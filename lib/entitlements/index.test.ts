import { describe, expect, it } from "vitest";

import {
  billingRedirectIsAuthoritative,
  can,
  effectivePlan,
  PAST_DUE_GRACE_MS,
  requireEntitlement,
} from "@/lib/entitlements";
import { ForbiddenError } from "@/lib/errors";

const prices = { price_pro: "PRO" as const, price_biz: "BUSINESS" as const };

describe("entitlements matrix", () => {
  it("maps capabilities to Free, Pro, and Business", () => {
    expect(can({ plan: "FREE" }, "STRIPE_PAYMENTS")).toBe(false);
    expect(can({ plan: "FREE" }, "AUTOMATIC_REMINDERS")).toBe(false);
    expect(can({ plan: "FREE" }, "ADVANCED_PAYMENT_TRACKING")).toBe(false);
    expect(can({ plan: "FREE" }, "TEAM_MEMBERS")).toBe(false);
    expect(can({ plan: "FREE" }, "PREMIUM_TEMPLATE_UNBRANDED")).toBe(true);

    expect(can({ plan: "PRO" }, "STRIPE_PAYMENTS")).toBe(true);
    expect(can({ plan: "PRO" }, "AUTOMATIC_REMINDERS")).toBe(true);
    expect(can({ plan: "PRO" }, "TEAM_MEMBERS")).toBe(false);
    expect(can({ plan: "PRO" }, "ADVANCED_REPORTS")).toBe(false);

    expect(can({ plan: "BUSINESS" }, "STRIPE_PAYMENTS")).toBe(true);
    expect(can({ plan: "BUSINESS" }, "TEAM_MEMBERS")).toBe(true);
    expect(can({ plan: "BUSINESS" }, "ADVANCED_REPORTS")).toBe(true);
    expect(can({ plan: "BUSINESS" }, "FORECASTING")).toBe(true);
    expect(can({ plan: "BUSINESS" }, "PERFORMANCE_INSIGHTS")).toBe(true);
    expect(can({ plan: "BUSINESS" }, "TEAM_ANALYTICS")).toBe(true);
  });

  it("keeps past_due entitlements for seven days after the period end", () => {
    const periodEnd = new Date("2026-08-01T00:00:00.000Z");
    const within = new Date(periodEnd.getTime() + PAST_DUE_GRACE_MS);
    const after = new Date(periodEnd.getTime() + PAST_DUE_GRACE_MS + 1);
    expect(
      effectivePlan(
        { status: "PAST_DUE", stripePriceId: "price_pro", currentPeriodEnd: periodEnd },
        prices,
        within,
      ),
    ).toBe("PRO");
    expect(
      effectivePlan(
        { status: "PAST_DUE", stripePriceId: "price_pro", currentPeriodEnd: periodEnd },
        prices,
        after,
      ),
    ).toBe("FREE");
  });

  it("treats active and trialing as paid and canceled as Free", () => {
    expect(
      effectivePlan(
        { status: "ACTIVE", stripePriceId: "price_biz", currentPeriodEnd: null },
        prices,
      ),
    ).toBe("BUSINESS");
    expect(
      effectivePlan(
        { status: "TRIALING", stripePriceId: "price_pro", currentPeriodEnd: null },
        prices,
      ),
    ).toBe("PRO");
    expect(
      effectivePlan(
        { status: "CANCELED", stripePriceId: "price_pro", currentPeriodEnd: null },
        prices,
      ),
    ).toBe("FREE");
    expect(
      effectivePlan(
        { status: "UNPAID", stripePriceId: "price_pro", currentPeriodEnd: null },
        prices,
      ),
    ).toBe("FREE");
    expect(effectivePlan(null, prices)).toBe("FREE");
  });

  it("denies premium mutations server-side and never trusts the billing success URL", () => {
    expect(() => requireEntitlement({ plan: "FREE" }, "STRIPE_PAYMENTS")).toThrow(ForbiddenError);
    expect(billingRedirectIsAuthoritative()).toBe(false);
  });
});
