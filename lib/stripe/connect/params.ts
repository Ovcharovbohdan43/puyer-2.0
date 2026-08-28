import type Stripe from "stripe";

import { assertMerchantOnlyAccountCreate, assertSafeDirectChargePayload } from "@/lib/stripe/forbidden";

export type DirectChargeCheckoutInput = {
  connectedAccountId: string;
  invoiceId: string;
  publicId: string;
  invoiceNumber: string;
  currency: string;
  totalMinor: bigint;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

export function buildConnectedAccountCreateParams(input: {
  email: string;
  displayName: string;
  currency: string;
  country: string;
}): Stripe.V2.Core.AccountCreateParams {
  const params: Stripe.V2.Core.AccountCreateParams = {
    contact_email: input.email,
    display_name: input.displayName,
    dashboard: "full",
    identity: {
      country: input.country.toLowerCase(),
      entity_type: "individual",
    },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
    },
    defaults: {
      currency: input.currency.toLowerCase(),
      responsibilities: {
        fees_collector: "stripe",
        losses_collector: "stripe",
      },
    },
    include: ["configuration.merchant", "identity", "requirements"],
  };
  assertMerchantOnlyAccountCreate(params);
  return params;
}

export function buildAccountOnboardingLinkParams(input: {
  accountId: string;
  returnUrl: string;
  refreshUrl: string;
}): Stripe.V2.Core.AccountLinkCreateParams {
  return {
    account: input.accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["merchant"],
        return_url: input.returnUrl,
        refresh_url: input.refreshUrl,
      },
    },
  };
}

export function buildDirectChargeCheckout(input: DirectChargeCheckoutInput): {
  params: Stripe.Checkout.SessionCreateParams;
  requestOptions: Stripe.RequestOptions;
} {
  if (input.totalMinor <= 0n) {
    throw new Error("Checkout amount must be greater than zero.");
  }
  if (input.totalMinor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Checkout amount is too large.");
  }
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: Number(input.totalMinor),
          product_data: {
            name: `Invoice ${input.invoiceNumber}`,
          },
        },
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.publicId,
    metadata: {
      puyer_invoice_id: input.invoiceId,
      puyer_public_id: input.publicId,
    },
    payment_intent_data: {
      metadata: {
        puyer_invoice_id: input.invoiceId,
        puyer_public_id: input.publicId,
      },
    },
  };
  if (input.customerEmail) {
    params.customer_email = input.customerEmail;
  }
  const requestOptions: Stripe.RequestOptions = {
    stripeAccount: input.connectedAccountId,
    idempotencyKey: `invoice_pay:${input.invoiceId}:${input.totalMinor.toString()}`,
  };
  assertSafeDirectChargePayload(params, requestOptions);
  return { params, requestOptions };
}
