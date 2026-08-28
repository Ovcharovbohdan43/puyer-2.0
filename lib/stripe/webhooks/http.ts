import "server-only";

import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe/client";
import { ingestStripeEvent } from "@/lib/stripe/webhooks/ingest";
import { clientIp } from "@/lib/http/ip";
import { consumeRateLimit } from "@/lib/rate-limit/consume";
import { logger } from "@/lib/observability/logger";

export async function handleStripeWebhook(
  request: Request,
  expectedDomain: "CONNECT" | "PLATFORM",
  secret: string | undefined,
): Promise<Response> {
  if (!secret?.startsWith("whsec_")) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured." }, { status: 503 });
  }
  if (!(await consumeRateLimit("stripe-webhook", clientIp(request)))) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await (await request.blob()).text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    logger.warn("stripe_webhook_invalid_signature", { domain: expectedDomain });
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 400 });
  }

  try {
    await ingestStripeEvent({ event, rawBody, expectedDomain });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Webhook handler failed." }, { status: 500 });
  }
}
