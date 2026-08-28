import type Stripe from "stripe";

import { assertNoStripeAccountHeader, payloadContainsForbiddenMoneyFields } from "@/lib/stripe/forbidden";

export function buildPlatformSubscriptionCheckout(input: {
  customerId: string;
  priceId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
}): { params: Stripe.Checkout.SessionCreateParams; requestOptions: Stripe.RequestOptions } {
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer: input.customerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.organizationId,
    metadata: { puyer_organization_id: input.organizationId },
    subscription_data: {
      metadata: { puyer_organization_id: input.organizationId },
    },
  };
  const requestOptions: Stripe.RequestOptions = {
    idempotencyKey: `sub_create:${input.organizationId}:${input.priceId}`,
  };
  assertNoStripeAccountHeader(requestOptions);
  if (payloadContainsForbiddenMoneyFields(params) || payloadContainsForbiddenMoneyFields(requestOptions)) {
    throw new Error("Forbidden Connect money field.");
  }
  return { params, requestOptions };
}

export function buildCustomerPortalParams(input: {
  customerId: string;
  returnUrl: string;
}): Stripe.BillingPortal.SessionCreateParams {
  const params: Stripe.BillingPortal.SessionCreateParams = {
    customer: input.customerId,
    return_url: input.returnUrl,
  };
  if (payloadContainsForbiddenMoneyFields(params) || "on_behalf_of" in params) {
    throw new Error("Customer Portal must stay on the platform account.");
  }
  return params;
}
