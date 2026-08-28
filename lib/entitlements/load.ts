import "server-only";

import type { Plan } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { effectivePlan, type SubscriptionSnapshot } from "@/lib/entitlements";
import { platformPriceToPlan } from "@/lib/stripe/platform/prices";

export async function loadEffectivePlan(organizationId: string, now = new Date()): Promise<Plan> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  });
  return planFromRow(subscription, now);
}

export function planFromRow(
  subscription: {
    status: SubscriptionSnapshot["status"];
    stripePriceId: string;
    currentPeriodEnd: Date | null;
  } | null,
  now = new Date(),
): Plan {
  return effectivePlan(toSnapshot(subscription), platformPriceToPlan(), now);
}

function toSnapshot(
  subscription: {
    status: SubscriptionSnapshot["status"];
    stripePriceId: string;
    currentPeriodEnd: Date | null;
  } | null,
): SubscriptionSnapshot | null {
  if (!subscription) {
    return null;
  }
  return {
    status: subscription.status,
    stripePriceId: subscription.stripePriceId,
    currentPeriodEnd: subscription.currentPeriodEnd,
  };
}
