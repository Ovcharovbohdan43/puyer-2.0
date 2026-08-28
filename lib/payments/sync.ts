import "server-only";

import type { InvoicePaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { canTransition } from "@/lib/invoices/status";
import { paidStatusForAmount } from "@/lib/invoices/payable";
import { notifyOrganizationMembers } from "@/lib/notifications";
import { logger } from "@/lib/observability/logger";

export async function upsertInvoicePayment(input: {
  invoiceId: string;
  organizationId: string;
  stripeConnectedAccountId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  amountMinor: bigint;
  currency: string;
  status: InvoicePaymentStatus;
  paidAt?: Date | null;
}) {
  const existing = input.stripeCheckoutSessionId
    ? await prisma.invoicePayment.findUnique({
        where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
      })
    : input.stripePaymentIntentId
      ? await prisma.invoicePayment.findUnique({
          where: { stripePaymentIntentId: input.stripePaymentIntentId },
        })
      : null;

  const data = {
    invoiceId: input.invoiceId,
    organizationId: input.organizationId,
    stripeConnectedAccountId: input.stripeConnectedAccountId,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? existing?.stripeCheckoutSessionId ?? null,
    stripePaymentIntentId: input.stripePaymentIntentId ?? existing?.stripePaymentIntentId ?? null,
    amountMinor: input.amountMinor,
    currency: input.currency.toUpperCase(),
    status: input.status,
    paidAt: input.paidAt ?? existing?.paidAt ?? null,
  };

  if (existing) {
    return prisma.invoicePayment.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.invoicePayment.create({ data });
}

export async function applySucceededPayment(input: {
  invoiceId: string;
  organizationId: string;
  stripeConnectedAccountId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  amountMinor: bigint;
  currency: string;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: input.invoiceId, organizationId: input.organizationId },
  });
  if (!invoice) {
    logger.warn("connect_payment_unknown_invoice");
    return;
  }

  let statusChanged = false;
  await prisma.$transaction(async (tx) => {
    await upsertInvoicePaymentInTx(tx, {
      ...input,
      status: "SUCCEEDED",
      paidAt: new Date(),
    });
    const nextStatus = paidStatusForAmount(input.amountMinor, invoice.totalMinor);
    if (invoice.status === nextStatus || invoice.status === "PAID") {
      return;
    }
    if (!canTransition(invoice.status, nextStatus)) {
      logger.warn("connect_payment_status_skipped", { from: invoice.status, to: nextStatus });
      return;
    }
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: nextStatus },
    });
    statusChanged = true;
  });
  if (statusChanged) {
    await notifyOrganizationMembers({
      organizationId: input.organizationId,
      type: "PAYMENT",
      title: "Invoice payment received",
      message: `A payment for ${invoice.invoiceNumber} was recorded on your connected Stripe account.`,
      entityType: "Invoice",
      entityId: invoice.id,
    });
  }
}

async function upsertInvoicePaymentInTx(
  tx: Prisma.TransactionClient,
  input: {
    invoiceId: string;
    organizationId: string;
    stripeConnectedAccountId: string;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    amountMinor: bigint;
    currency: string;
    status: InvoicePaymentStatus;
    paidAt?: Date | null;
  },
) {
  const existing = input.stripeCheckoutSessionId
    ? await tx.invoicePayment.findUnique({
        where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
      })
    : input.stripePaymentIntentId
      ? await tx.invoicePayment.findUnique({
          where: { stripePaymentIntentId: input.stripePaymentIntentId },
        })
      : null;

  const data = {
    invoiceId: input.invoiceId,
    organizationId: input.organizationId,
    stripeConnectedAccountId: input.stripeConnectedAccountId,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? existing?.stripeCheckoutSessionId ?? null,
    stripePaymentIntentId: input.stripePaymentIntentId ?? existing?.stripePaymentIntentId ?? null,
    amountMinor: input.amountMinor,
    currency: input.currency.toUpperCase(),
    status: input.status,
    paidAt: input.paidAt ?? existing?.paidAt ?? null,
  };

  if (existing) {
    return tx.invoicePayment.update({ where: { id: existing.id }, data });
  }
  return tx.invoicePayment.create({ data });
}

export async function listOrganizationPayments(organizationId: string) {
  return prisma.invoicePayment.findMany({
    where: { organizationId },
    include: { invoice: { select: { invoiceNumber: true, publicId: true, clientName: true } } },
    orderBy: { createdAt: "desc" },
  });
}
