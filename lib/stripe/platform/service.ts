import "server-only";

import { SubscriptionError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { appBaseUrl, getStripe } from "@/lib/stripe/client";
import { assertNoStripeAccountHeader } from "@/lib/stripe/forbidden";
import { buildCustomerPortalParams, buildPlatformSubscriptionCheckout } from "@/lib/stripe/platform/params";

export async function ensurePlatformCustomer(input: {
  organizationId: string;
  email: string;
  name: string;
}): Promise<string> {
  const existing = await prisma.subscription.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: { puyer_organization_id: input.organizationId },
  });
  await prisma.subscription.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: `pending_${input.organizationId}`,
      stripePriceId: "pending",
      status: "INCOMPLETE",
    },
    update: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

export async function createSubscriptionCheckout(input: {
  organizationId: string;
  email: string;
  name: string;
  priceId: string;
}) {
  const customerId = await ensurePlatformCustomer({
    organizationId: input.organizationId,
    email: input.email,
    name: input.name,
  });
  const base = appBaseUrl();
  const { params, requestOptions } = buildPlatformSubscriptionCheckout({
    customerId,
    priceId: input.priceId,
    organizationId: input.organizationId,
    successUrl: `${base}/billing/success`,
    cancelUrl: `${base}/billing`,
  });
  assertNoStripeAccountHeader(requestOptions);
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create(params, requestOptions);
  if (!session.url) {
    throw new SubscriptionError("Checkout is unavailable.");
  }
  return session;
}

export async function createCustomerPortalSession(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });
  if (!subscription?.stripeCustomerId) {
    throw new SubscriptionError("No Puyer subscription to manage.");
  }
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create(
    buildCustomerPortalParams({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${appBaseUrl()}/billing`,
    }),
  );
  if (!session.url) {
    throw new SubscriptionError("Billing portal is unavailable.");
  }
  return session;
}
