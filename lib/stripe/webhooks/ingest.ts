import "server-only";

import { Prisma } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";
import { hashWebhookPayload } from "@/lib/stripe/webhooks/hash";
import { isTerminalWebhookStatus, stripeWebhookDomain } from "@/lib/stripe/webhooks/domain";
import { processConnectEvent } from "@/lib/stripe/webhooks/process-connect";
import { processPlatformEvent } from "@/lib/stripe/webhooks/process-platform";
import { applyPlatformSubscriptionEvent } from "@/lib/stripe/platform/sync";
import { logger } from "@/lib/observability/logger";

export async function ingestStripeEvent(input: {
  event: Stripe.Event;
  rawBody: string;
  expectedDomain: "CONNECT" | "PLATFORM";
}) {
  const domain = stripeWebhookDomain(input.event);
  const payloadHash = hashWebhookPayload(input.rawBody);

  let row;
  try {
    row = await prisma.webhookEvent.create({
      data: {
        eventId: input.event.id,
        type: input.event.type,
        stripeAccountId: input.event.account ?? null,
        domain: input.expectedDomain,
        payloadHash,
        status: "RECEIVED",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.webhookEvent.findUnique({ where: { eventId: input.event.id } });
      if (existing && isTerminalWebhookStatus(existing.status)) {
        return { duplicate: true as const, status: existing.status };
      }
      row = existing;
    } else {
      throw error;
    }
  }

  if (!row) {
    return { duplicate: true as const, status: "PROCESSED" as const };
  }

  if (domain !== input.expectedDomain) {
    await prisma.webhookEvent.update({
      where: { id: row.id },
      data: { status: "IGNORED", processedAt: new Date(), error: "domain_mismatch" },
    });
    return { duplicate: false as const, status: "IGNORED" as const };
  }

  try {
    const result =
      input.expectedDomain === "CONNECT"
        ? await processConnectEvent(input.event)
        : await (async () => {
            const routed = processPlatformEvent(input.event);
            if (routed.status === "PROCESSED") {
              await applyPlatformSubscriptionEvent(input.event);
            }
            return routed.status;
          })();

    await prisma.webhookEvent.update({
      where: { id: row.id },
      data: { status: result, processedAt: new Date() },
    });
    return { duplicate: false as const, status: result };
  } catch (error) {
    logger.error("stripe_webhook_failed", { type: input.event.type });
    await prisma.webhookEvent.update({
      where: { id: row.id },
      data: { status: "FAILED", error: "handler_failed", processedAt: new Date() },
    });
    throw error;
  }
}
