import "server-only";

import type { Plan, PlanSource, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { assignedPlan, effectivePlan, type SubscriptionSnapshot } from "@/lib/entitlements";
import { platformPriceToPlan } from "@/lib/stripe/platform/prices";

export type OrganizationBilling = {
  plan: Plan;
  planSource: PlanSource;
  subscriptionStatus: SubscriptionStatus;
  subscription: {
    status: SubscriptionSnapshot["status"];
    stripePriceId: string;
    currentPeriodEnd: Date | null;
  } | null;
};

export async function loadEffectivePlan(organizationId: string, now = new Date()): Promise<Plan> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      plan: true,
      planSource: true,
      subscriptionStatus: true,
      subscription: true,
    },
  });
  if (!organization) {
    return "FREE";
  }
  return planFromOrganization(organization, now);
}

export function planFromOrganization(organization: OrganizationBilling, now = new Date()): Plan {
  if (organization.planSource === "MANUAL") {
    return assignedPlan(organization.plan, organization.subscriptionStatus, now);
  }
  return planFromRow(organization.subscription, now);
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
