import { describe, expect, it } from "vitest";

import { payloadContainsForbiddenMoneyFields } from "@/lib/stripe/forbidden";
import { buildCustomerPortalParams, buildPlatformSubscriptionCheckout } from "@/lib/stripe/platform/params";
import { isConnectSubscriptionEvent } from "@/lib/stripe/webhooks/domain";
import { processPlatformEvent } from "@/lib/stripe/webhooks/process-platform";

describe("platform subscription Checkout", () => {
  it("uses subscription mode on the platform account with no fees or stripeAccount", () => {
    const { params, requestOptions } = buildPlatformSubscriptionCheckout({
      customerId: "cus_platform",
      priceId: "price_pro",
      organizationId: "11111111-1111-4111-8111-111111111111",
      successUrl: "https://puyer.test/billing/success",
      cancelUrl: "https://puyer.test/billing",
    });
    expect(params.mode).toBe("subscription");
    expect(params.customer).toBe("cus_platform");
    expect(requestOptions.stripeAccount).toBeUndefined();
    expect(requestOptions.idempotencyKey).toBe(
      "sub_create:11111111-1111-4111-8111-111111111111:price_pro",
    );
    expect(payloadContainsForbiddenMoneyFields(params)).toBe(false);
    expect(JSON.stringify(params)).not.toContain("application_fee_amount");
    expect(JSON.stringify(params)).not.toContain("transfer_data");
    expect(JSON.stringify(requestOptions)).not.toContain("stripeAccount");
  });

  it("opens Customer Portal for the platform customer only", () => {
    const params = buildCustomerPortalParams({
      customerId: "cus_platform",
      returnUrl: "https://puyer.test/billing",
    });
    expect(params.customer).toBe("cus_platform");
    expect(params.return_url).toBe("https://puyer.test/billing");
    expect(JSON.stringify(params)).not.toContain("on_behalf_of");
    expect(JSON.stringify(params)).not.toContain("customer_account");
  });
});

describe("platform webhook isolation", () => {
  it("processes billing events without marking a Puyer invoice paid", () => {
    const result = processPlatformEvent({
      id: "evt_sub",
      object: "event",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1" } },
    } as never);
    expect(result.status).toBe("PROCESSED");
    expect(result.markedInvoicePaid).toBe(false);
  });

  it("treats platform Checkout completion as billing, not invoice payment", () => {
    const result = processPlatformEvent({
      id: "evt_checkout",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", mode: "subscription" } },
    } as never);
    expect(result.status).toBe("PROCESSED");
    expect(result.markedInvoicePaid).toBe(false);
  });

  it("ignores Connect subscription events so they cannot update Organization.plan", () => {
    expect(isConnectSubscriptionEvent("customer.subscription.updated")).toBe(true);
    const result = processPlatformEvent({
      id: "evt_connect_sub",
      object: "event",
      account: "acct_connected",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1" } },
    } as never);
    expect(result.status).toBe("IGNORED");
    expect(result.markedInvoicePaid).toBe(false);
  });
});
