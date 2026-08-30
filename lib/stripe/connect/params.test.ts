import { describe, expect, it } from "vitest";

import { checkoutRedirectIsAuthoritative, isPayableStatus } from "@/lib/invoices/payable";
import { canTransition } from "@/lib/invoices/status";
import {
  buildAccountOnboardingLinkParams,
  buildConnectedAccountCreateParams,
  buildDirectChargeCheckout,
} from "@/lib/stripe/connect/params";
import { buildPlatformSubscriptionCheckout } from "@/lib/stripe/platform/params";
import {
  assertMerchantOnlyAccountCreate,
  assertNoStripeAccountHeader,
  assertSafeDirectChargePayload,
  payloadContainsForbiddenMoneyFields,
} from "@/lib/stripe/forbidden";
import { isTerminalWebhookStatus, stripeWebhookDomain } from "@/lib/stripe/webhooks/domain";
import { hashWebhookPayload } from "@/lib/stripe/webhooks/hash";
import { processPlatformEvent } from "@/lib/stripe/webhooks/process-platform";

const checkoutInput = {
  connectedAccountId: "acct_connected",
  invoiceId: "11111111-1111-1111-1111-111111111111",
  publicId: "abcdefghijklmnopqrstuv",
  invoiceNumber: "INV-2026-0001",
  currency: "USD",
  totalMinor: 650000n,
  successUrl: "https://puyer.test/invoice/abcdefghijklmnopqrstuv?checkout=success",
  cancelUrl: "https://puyer.test/invoice/abcdefghijklmnopqrstuv?checkout=cancel",
};

describe("direct charge Checkout", () => {
  it("always sets stripeAccount and never includes application fees or transfers", () => {
    const { params, requestOptions } = buildDirectChargeCheckout(checkoutInput);
    expect(requestOptions.stripeAccount).toBe("acct_connected");
    expect(params.mode).toBe("payment");
    expect(payloadContainsForbiddenMoneyFields(params)).toBe(false);
    expect(() => assertSafeDirectChargePayload(params, requestOptions)).not.toThrow();
    expect(JSON.stringify(params)).not.toContain("application_fee_amount");
    expect(JSON.stringify(params)).not.toContain("transfer_data");
    expect(JSON.stringify(params)).not.toContain("destination");
  });

  it("refuses Checkout without a connected account header", () => {
    expect(() =>
      assertSafeDirectChargePayload({ mode: "payment" }, { stripeAccount: "" }),
    ).toThrow(/stripeAccount/);
  });
});

describe("Accounts v2 create payload", () => {
  it("locks full dashboard and Stripe fee/loss collection without recipient/transfers", () => {
    const params = buildConnectedAccountCreateParams({
      email: "owner@example.com",
      displayName: "Studio",
      currency: "USD",
      country: "UA",
    });
    expect(params.identity?.country).toBe("ua");
    expect(params.defaults?.currency).toBe("usd");
    expect(() => assertMerchantOnlyAccountCreate(params)).not.toThrow();
    const link = buildAccountOnboardingLinkParams({
      accountId: "acct_123",
      returnUrl: "https://puyer.test/settings?stripe=return",
      refreshUrl: "https://puyer.test/settings?stripe=refresh",
    });
    expect(link.use_case.account_onboarding?.configurations).toEqual(["merchant"]);
    expect(JSON.stringify(link)).not.toContain("recipient");
  });
});

describe("platform Stripe isolation", () => {
  it("never attaches stripeAccount to platform subscription Checkout options", () => {
    const { requestOptions } = buildPlatformSubscriptionCheckout({
      customerId: "cus_platform",
      priceId: "price_pro",
      organizationId: "11111111-1111-4111-8111-111111111111",
      successUrl: "https://puyer.test/billing/success",
      cancelUrl: "https://puyer.test/billing",
    });
    expect(() => assertNoStripeAccountHeader(requestOptions)).not.toThrow();
    expect(requestOptions.stripeAccount).toBeUndefined();
  });

  it("does not mark a Puyer invoice paid from a platform event", () => {
    const result = processPlatformEvent({
      id: "evt_platform",
      object: "event",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_1" } },
    } as never);
    expect(result.markedInvoicePaid).toBe(false);
    expect(result.status).toBe("IGNORED");
  });

  it("ignores Connect events on the platform handler", () => {
    const result = processPlatformEvent({
      id: "evt_connect",
      object: "event",
      account: "acct_connected",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_1" } },
    } as never);
    expect(result.markedInvoicePaid).toBe(false);
    expect(result.status).toBe("IGNORED");
  });
});

describe("webhook routing and idempotency helpers", () => {
  it("routes events with account to Connect", () => {
    expect(stripeWebhookDomain({ account: "acct_1" })).toBe("CONNECT");
    expect(stripeWebhookDomain({})).toBe("PLATFORM");
  });

  it("hashes the same payload consistently", () => {
    expect(hashWebhookPayload('{"id":"evt_1"}')).toBe(hashWebhookPayload('{"id":"evt_1"}'));
    expect(hashWebhookPayload('{"id":"evt_1"}')).not.toBe(hashWebhookPayload('{"id":"evt_2"}'));
    expect(isTerminalWebhookStatus("PROCESSED")).toBe(true);
    expect(isTerminalWebhookStatus("RECEIVED")).toBe(false);
  });
});

describe("invoice pay status", () => {
  it("allows SENT and VIEWED to become PAID and never trusts the success URL", () => {
    expect(canTransition("SENT", "PAID")).toBe(true);
    expect(canTransition("VIEWED", "PAID")).toBe(true);
    expect(canTransition("READY", "PAID")).toBe(true);
    expect(isPayableStatus("SENT")).toBe(true);
    expect(isPayableStatus("PAID")).toBe(false);
    expect(checkoutRedirectIsAuthoritative()).toBe(false);
  });
});
