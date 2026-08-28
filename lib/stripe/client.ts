import "server-only";

import Stripe from "stripe";

import { StripeConnectionError } from "@/lib/errors";
import { STRIPE_API_VERSION } from "@/lib/stripe/version";

let client: Stripe | null = null;

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key.startsWith("sk_")) {
    throw new StripeConnectionError("Stripe is not configured.");
  }
  return key;
}

export function getStripe(): Stripe {
  const key = getStripeSecretKey();
  if (!client) {
    client = new Stripe(key, {
      apiVersion: STRIPE_API_VERSION,
      appInfo: { name: "Puyer", version: "0.1.0" },
      typescript: true,
    });
  }
  return client;
}

export function appBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return url.replace(/\/$/, "");
}
