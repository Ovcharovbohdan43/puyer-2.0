import "server-only";

import { Prisma, type SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db/prisma";
import { effectivePlan } from "@/lib/entitlements";
import { logger } from "@/lib/observability/logger";
import { getStripe } from "@/lib/stripe/client";
import { platformPriceToPlan } from "@/lib/stripe/platform/prices";

export async function applyPlatformSubscriptionEvent(event: Stripe.Event): Promise<void> {
  if (event.account) {
    return;
  }
  if (event.type.startsWith("customer.subscription.")) {
    await upsertFromSubscription(event.data.object as Stripe.Subscription, event.id, event.type);
    return;
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "subscription") {
      return;
    }
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (!subscriptionId) {
      return;
    }
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data"],
    });
    const fallbackOrg =
      session.metadata?.puyer_organization_id ||
      (typeof session.client_reference_id === "string" ? session.client_reference_id : null);
    await upsertFromSubscription(subscription, event.id, event.type, fallbackOrg);
    return;
  }
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = subscriptionIdFromInvoice(invoice);
    if (!subscriptionId) {
      return;
    }
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data"],
    });
    await upsertFromSubscription(subscription, event.id, event.type);
  }
}

async function upsertFromSubscription(
  subscription: Stripe.Subscription,
  stripeEventId: string,
  type: string,
  fallbackOrganizationId?: string | null,
) {
  const organizationId = organizationIdFrom(subscription) ?? uuidOrNull(fallbackOrganizationId);
  if (!organizationId) {
    logger.warn("platform_subscription_missing_org");
    return;
  }
  const item = subscription.items.data[0];
  const priceId = typeof item?.price === "string" ? item.price : item?.price?.id;
  if (!priceId) {
    logger.warn("platform_subscription_missing_price");
    return;
  }
  const status = mapStatus(subscription.status);
  if (!status) {
    return;
  }
  const customerId = stripeCustomerId(subscription.customer);
  const periodStart = unixToDate(item?.current_period_start);
  const periodEnd = unixToDate(item?.current_period_end);
  const prices = platformPriceToPlan();
  const plan = effectivePlan({ status, stripePriceId: priceId, currentPeriodEnd: periodEnd }, prices);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: { organizationId },
        create: {
          organizationId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
        update: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });
      await tx.organization.update({
        where: { id: organizationId },
        data: { plan },
      });
      await tx.subscriptionEvent.upsert({
        where: { stripeEventId },
        create: { organizationId, stripeEventId, type },
        update: {},
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      logger.warn("platform_subscription_org_missing");
      return;
    }
    throw error;
  }

  await writeAuditLog({
    organizationId,
    action: "SUBSCRIPTION_CHANGED",
    entityType: "Subscription",
    entityId: subscription.id,
  });
}

function organizationIdFrom(subscription: Stripe.Subscription): string | null {
  return uuidOrNull(subscription.metadata?.puyer_organization_id);
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent?.subscription_details?.subscription;
  if (!parent) {
    return null;
  }
  return typeof parent === "string" ? parent : parent.id;
}

function stripeCustomerId(customer: Stripe.Subscription["customer"]): string {
  if (typeof customer === "string") {
    return customer;
  }
  return customer.id;
}

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus | null {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "unpaid":
      return "UNPAID";
    case "canceled":
    case "paused":
      return "CANCELED";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    default:
      return "CANCELED";
  }
}

function unixToDate(value: number | undefined): Date | null {
  if (!value) {
    return null;
  }
  return new Date(value * 1000);
}

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    return null;
  }
  return value;
}
