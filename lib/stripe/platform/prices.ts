import type { Plan } from "@prisma/client";

import { ValidationError } from "@/lib/errors";

export type BillingPlan = "PRO" | "BUSINESS";
export type BillingInterval = "month" | "year";

export function platformPriceToPlan(
  env: NodeJS.ProcessEnv = process.env,
): Record<string, Plan> {
  const map: Record<string, Plan> = {};
  add(map, env.STRIPE_PLATFORM_PRICE_PRO, "PRO");
  add(map, env.STRIPE_PLATFORM_PRICE_PRO_YEARLY, "PRO");
  add(map, env.STRIPE_PLATFORM_PRICE_BUSINESS, "BUSINESS");
  add(map, env.STRIPE_PLATFORM_PRICE_BUSINESS_YEARLY, "BUSINESS");
  return map;
}

export function priceIdFor(plan: BillingPlan, interval: BillingInterval, env: NodeJS.ProcessEnv = process.env): string {
  const key =
    plan === "PRO"
      ? interval === "year"
        ? env.STRIPE_PLATFORM_PRICE_PRO_YEARLY
        : env.STRIPE_PLATFORM_PRICE_PRO
      : interval === "year"
        ? env.STRIPE_PLATFORM_PRICE_BUSINESS_YEARLY
        : env.STRIPE_PLATFORM_PRICE_BUSINESS;
  const id = key?.trim() ?? "";
  if (!id.startsWith("price_")) {
    throw new ValidationError(
      interval === "year" ? "Yearly billing is not configured." : "Puyer billing is not configured.",
    );
  }
  return id;
}

export function parseBillingPlan(value: unknown): BillingPlan {
  if (value === "PRO" || value === "BUSINESS") {
    return value;
  }
  throw new ValidationError("Choose Pro or Business.");
}

export function parseBillingInterval(value: unknown): BillingInterval {
  if (value === "year" || value === "yearly") {
    return "year";
  }
  return "month";
}

function add(map: Record<string, Plan>, value: string | undefined, plan: Plan) {
  const id = value?.trim();
  if (id) {
    map[id] = plan;
  }
}
