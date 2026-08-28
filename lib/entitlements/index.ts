import type { Plan, SubscriptionStatus } from "@prisma/client";

import { ForbiddenError } from "@/lib/errors";

export type Capability =
  | "STRIPE_PAYMENTS"
  | "AUTOMATIC_REMINDERS"
  | "ADVANCED_PAYMENT_TRACKING"
  | "TEAM_MEMBERS"
  | "ADVANCED_REPORTS"
  | "FORECASTING"
  | "PERFORMANCE_INSIGHTS"
  | "TEAM_ANALYTICS"
  | "PREMIUM_TEMPLATE_UNBRANDED";

export const PAST_DUE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

const PRO_PLUS: ReadonlySet<Capability> = new Set([
  "STRIPE_PAYMENTS",
  "AUTOMATIC_REMINDERS",
  "ADVANCED_PAYMENT_TRACKING",
]);

const BUSINESS_ONLY: ReadonlySet<Capability> = new Set([
  "TEAM_MEMBERS",
  "ADVANCED_REPORTS",
  "FORECASTING",
  "PERFORMANCE_INSIGHTS",
  "TEAM_ANALYTICS",
]);

export type SubscriptionSnapshot = {
  status: SubscriptionStatus;
  stripePriceId: string;
  currentPeriodEnd: Date | null;
};

export function can(org: { plan: Plan }, capability: Capability): boolean {
  if (capability === "PREMIUM_TEMPLATE_UNBRANDED") {
    return true;
  }
  if (PRO_PLUS.has(capability)) {
    return org.plan === "PRO" || org.plan === "BUSINESS";
  }
  if (BUSINESS_ONLY.has(capability)) {
    return org.plan === "BUSINESS";
  }
  return false;
}

export function requireEntitlement(org: { plan: Plan }, capability: Capability): void {
  if (!can(org, capability)) {
    throw new ForbiddenError(upgradeMessage(capability));
  }
}

export function upgradeMessage(capability: Capability): string {
  if (BUSINESS_ONLY.has(capability)) {
    return "Upgrade to Business to use this feature.";
  }
  return "Upgrade to Pro to use this feature.";
}

export function effectivePlan(
  subscription: SubscriptionSnapshot | null,
  priceToPlan: Readonly<Record<string, Plan>>,
  now = new Date(),
): Plan {
  if (!subscription) {
    return "FREE";
  }
  const fromPrice = priceToPlan[subscription.stripePriceId] ?? "FREE";
  if (subscription.status === "ACTIVE" || subscription.status === "TRIALING") {
    return fromPrice;
  }
  if (subscription.status === "PAST_DUE") {
    const end = subscription.currentPeriodEnd?.getTime() ?? now.getTime();
    if (now.getTime() <= end + PAST_DUE_GRACE_MS) {
      return fromPrice;
    }
  }
  return "FREE";
}

export function billingRedirectIsAuthoritative(): boolean {
  return false;
}
