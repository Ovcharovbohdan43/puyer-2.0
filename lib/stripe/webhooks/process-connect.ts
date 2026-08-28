import "server-only";

import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";
import { applySucceededPayment, upsertInvoicePayment } from "@/lib/payments/sync";
import { retrieveConnectionSnapshot } from "@/lib/stripe/connect/service";
import { isConnectSubscriptionEvent } from "@/lib/stripe/webhooks/domain";
import { logger } from "@/lib/observability/logger";

export async function processConnectEvent(event: Stripe.Event): Promise<"PROCESSED" | "IGNORED"> {
  if (isConnectSubscriptionEvent(event.type)) {
    return "IGNORED";
  }

  const accountId = event.account;
  if (!accountId) {
    return "IGNORED";
  }

  switch (event.type) {
    case "account.updated":
      await handleAccountUpdated(accountId);
      return "PROCESSED";
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutSession(event.data.object as Stripe.Checkout.Session, accountId, event.type);
      return "PROCESSED";
    case "checkout.session.async_payment_failed":
    case "payment_intent.payment_failed":
      await handlePaymentFailed(event, accountId);
      return "PROCESSED";
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, accountId);
      return "PROCESSED";
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge, accountId);
      return "PROCESSED";
    case "charge.dispute.created":
      await handleDispute(event.data.object as Stripe.Dispute, accountId);
      return "PROCESSED";
    default:
      return "IGNORED";
  }
}

async function handleAccountUpdated(accountId: string) {
  const connection = await prisma.stripeConnection.findUnique({
    where: { stripeConnectedAccountId: accountId },
  });
  if (!connection || connection.status === "DISCONNECTED") {
    return;
  }
  const snapshot = await retrieveConnectionSnapshot(accountId);
  await prisma.stripeConnection.update({
    where: { id: connection.id },
    data: {
      status: snapshot.status,
      chargesEnabled: snapshot.chargesEnabled,
      payoutsEnabled: snapshot.payoutsEnabled,
      detailsSubmitted: snapshot.detailsSubmitted,
      lastAccountUpdatedAt: new Date(),
    },
  });
}

async function handleCheckoutSession(
  session: Stripe.Checkout.Session,
  accountId: string,
  type: string,
) {
  const invoiceId = session.metadata?.puyer_invoice_id;
  const publicId = session.metadata?.puyer_public_id ?? session.client_reference_id;
  const invoice = await findInvoice(invoiceId, publicId);
  if (!invoice) {
    logger.warn("connect_checkout_unknown_invoice");
    return;
  }
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const amount = BigInt(session.amount_total ?? 0);
  await upsertInvoicePayment({
    invoiceId: invoice.id,
    organizationId: invoice.organizationId,
    stripeConnectedAccountId: accountId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    amountMinor: amount,
    currency: session.currency ?? invoice.currency,
    status: "PENDING",
  });
  await recordPaymentEvent(invoice.organizationId, invoice.id, session.id, type);

  if (type === "checkout.session.async_payment_succeeded" && paymentIntentId) {
    await applySucceededPayment({
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      stripeConnectedAccountId: accountId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      amountMinor: amount,
      currency: session.currency ?? invoice.currency,
    });
  }
}

async function handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent, accountId: string) {
  const invoiceId = intent.metadata?.puyer_invoice_id;
  const existing = intent.id
    ? await prisma.invoicePayment.findUnique({ where: { stripePaymentIntentId: intent.id } })
    : null;
  const invoice = existing
    ? await prisma.invoice.findUnique({ where: { id: existing.invoiceId } })
    : await findInvoice(invoiceId, null);
  if (!invoice) {
    logger.warn("connect_pi_unknown_invoice");
    return;
  }
  await applySucceededPayment({
    invoiceId: invoice.id,
    organizationId: invoice.organizationId,
    stripeConnectedAccountId: accountId,
    stripePaymentIntentId: intent.id,
    stripeCheckoutSessionId: existing?.stripeCheckoutSessionId,
    amountMinor: BigInt(intent.amount_received || intent.amount),
    currency: intent.currency,
  });
  await recordPaymentEvent(invoice.organizationId, invoice.id, intent.id, "payment_intent.succeeded");
}

async function handlePaymentFailed(event: Stripe.Event, accountId: string) {
  const object = event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session;
  const invoiceId = "metadata" in object ? object.metadata?.puyer_invoice_id : undefined;
  const invoice = await findInvoice(invoiceId, null);
  if (!invoice) {
    return;
  }
  const isIntent = object.object === "payment_intent";
  await upsertInvoicePayment({
    invoiceId: invoice.id,
    organizationId: invoice.organizationId,
    stripeConnectedAccountId: accountId,
    stripePaymentIntentId: isIntent ? object.id : null,
    stripeCheckoutSessionId: object.object === "checkout.session" ? object.id : null,
    amountMinor: BigInt(isIntent ? object.amount : (object.amount_total ?? 0)),
    currency: object.currency ?? invoice.currency,
    status: "FAILED",
  });
}

async function handleChargeRefunded(charge: Stripe.Charge, accountId: string) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) {
    return;
  }
  const payment = await prisma.invoicePayment.findUnique({ where: { stripePaymentIntentId: pi } });
  if (!payment) {
    return;
  }
  const fullyRefunded = charge.amount_refunded >= charge.amount;
  await prisma.invoicePayment.update({
    where: { id: payment.id },
    data: { status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
  });
  void accountId;
}

async function handleDispute(dispute: Stripe.Dispute, accountId: string) {
  const pi =
    typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
  if (!pi) {
    return;
  }
  const payment = await prisma.invoicePayment.findUnique({ where: { stripePaymentIntentId: pi } });
  if (!payment) {
    return;
  }
  await prisma.invoicePayment.update({
    where: { id: payment.id },
    data: { status: "DISPUTED" },
  });
  void accountId;
}

async function findInvoice(invoiceId?: string | null, publicId?: string | null) {
  if (invoiceId) {
    const byId = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (byId) {
      return byId;
    }
  }
  if (publicId) {
    return prisma.invoice.findUnique({ where: { publicId } });
  }
  return null;
}

async function recordPaymentEvent(
  organizationId: string,
  invoiceId: string | null,
  stripeEventId: string,
  type: string,
) {
  await prisma.paymentEvent.create({
    data: { organizationId, invoiceId, stripeEventId, type },
  });
}
