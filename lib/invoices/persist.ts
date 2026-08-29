import "server-only";

import { Prisma, type Invoice, type InvoiceItem, type InvoiceStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { SessionUser } from "@/lib/authorization";
import { requireOrganization } from "@/lib/authorization";
import { requireInvoiceAccess } from "@/lib/authorization/invoice";
import { findOrCreateClient } from "@/lib/clients/persist";
import { sendInvoiceEmail } from "@/lib/email";
import { allocateInvoiceNumber } from "@/lib/invoices/allocate-number";
import { computeInvoiceFromBuilder, parseIssueDue } from "@/lib/invoices/compute";
import { getCurrency } from "@/lib/invoices/currencies";
import { formatMoney } from "@/lib/invoices/money";
import { createInvoicePublicId } from "@/lib/invoices/public-id";
import { isValidEmail, prepareBuilderState } from "@/lib/invoices/validate";
import { notifyOrganizationMembers } from "@/lib/notifications";
import { assertTransition, canTransition, displayInvoiceStatus, isEditableStatus } from "@/lib/invoices/status";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { paymentDetailsForStorage } from "@/lib/invoices/bank-transfer";
import type { BuilderState } from "@/components/invoice-builder/types";
import { logger } from "@/lib/observability/logger";

export type InvoiceWithItems = Invoice & { items: InvoiceItem[] };

export async function listOrganizationInvoices(user: SessionUser) {
  const membership = await requireOrganization(user);
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: membership.organizationId },
    select: {
      id: true,
      invoiceNumber: true,
      publicId: true,
      clientId: true,
      clientName: true,
      issueDate: true,
      dueDate: true,
      totalMinor: true,
      currency: true,
      status: true,
      createdAt: true,
      sentAt: true,
      viewedAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return invoices.map((invoice) => ({
    ...invoice,
    displayStatus: displayInvoiceStatus(invoice.status, invoice.dueDate),
  }));
}

export async function createInvoiceFromBuilder(user: SessionUser, state: BuilderState) {
  const membership = await requireOrganization(user);
  const prepared = prepareBuilderState(state);
  const computed = computeInvoiceFromBuilder(prepared);
  const { issue, due } = parseIssueDue(prepared.issueDate, prepared.dueDate);

  const invoice = await prisma.$transaction(async (tx) => {
    const client = await findOrCreateClient(tx, membership.organizationId, prepared.clientName, prepared.clientAddress);
    const invoiceNumber = await allocateInvoiceNumber(tx, membership.organizationId, issue);
    return tx.invoice.create({
      data: {
        organizationId: membership.organizationId,
        clientId: client.id,
        createdByUserId: user.id,
        publicId: createInvoicePublicId(),
        invoiceNumber,
        status: "READY",
        currency: computed.currency,
        issueDate: issue,
        dueDate: due,
        businessName: prepared.businessName.trim(),
        businessAddress: prepared.businessAddress.trim(),
        clientName: prepared.clientName.trim(),
        clientAddress: prepared.clientAddress.trim(),
        discountType: prepared.discountType,
        discountValue: prepared.discountType === "NONE" ? "0" : prepared.discountValue,
        taxRate: prepared.taxRate || "0",
        notes: prepared.notes,
        paymentDetails: paymentDetailsForStorage(prepared),
        template: prepared.template,
        accentColor: prepared.accentColor,
        subtotalMinor: computed.subtotalMinor,
        discountAmountMinor: computed.discountAmountMinor,
        taxAmountMinor: computed.taxAmountMinor,
        totalMinor: computed.totalMinor,
        items: {
          create: prepared.items.map((item, index) => ({
            description: item.description.trim(),
            quantityMinor: computed.quantityMinors[index] ?? 0n,
            unitPriceMinor: computed.unitPriceMinors[index] ?? 0n,
            amountMinor: computed.lineAmounts[index] ?? 0n,
            sortOrder: index,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    timeout: 10_000,
  });

  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "INVOICE_CREATED",
    entityType: "Invoice",
    entityId: invoice.id,
  });
  logger.info("invoice_created", { invoiceId: invoice.id });
  return invoice;
}

export async function updateInvoiceFromBuilder(user: SessionUser, invoiceId: string, state: BuilderState) {
  const { membership, invoice } = await requireInvoiceAccess(user, invoiceId);
  if (!isEditableStatus(invoice.status)) {
    throw new ValidationError("Paid, partially paid, and canceled invoices cannot be edited.");
  }
  const prepared = prepareBuilderState(state);
  const computed = computeInvoiceFromBuilder(prepared);
  const { issue, due } = parseIssueDue(prepared.issueDate, prepared.dueDate);

  const updated = await prisma.$transaction(async (tx) => {
    const client = await findOrCreateClient(tx, membership.organizationId, prepared.clientName, prepared.clientAddress);
    await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    return tx.invoice.update({
      where: { id: invoice.id },
      data: {
        clientId: client.id,
        currency: computed.currency,
        issueDate: issue,
        dueDate: due,
        businessName: prepared.businessName.trim(),
        businessAddress: prepared.businessAddress.trim(),
        clientName: prepared.clientName.trim(),
        clientAddress: prepared.clientAddress.trim(),
        discountType: prepared.discountType,
        discountValue: prepared.discountType === "NONE" ? "0" : prepared.discountValue,
        taxRate: prepared.taxRate || "0",
        notes: prepared.notes,
        paymentDetails: paymentDetailsForStorage(prepared),
        template: prepared.template,
        accentColor: prepared.accentColor,
        subtotalMinor: computed.subtotalMinor,
        discountAmountMinor: computed.discountAmountMinor,
        taxAmountMinor: computed.taxAmountMinor,
        totalMinor: computed.totalMinor,
        status: invoice.status === "DRAFT" ? "READY" : invoice.status,
        items: {
          create: prepared.items.map((item, index) => ({
            description: item.description.trim(),
            quantityMinor: computed.quantityMinors[index] ?? 0n,
            unitPriceMinor: computed.unitPriceMinors[index] ?? 0n,
            amountMinor: computed.lineAmounts[index] ?? 0n,
            sortOrder: index,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  });

  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "INVOICE_UPDATED",
    entityType: "Invoice",
    entityId: updated.id,
  });
  return updated;
}

export async function markInvoiceSent(user: SessionUser, invoiceId: string) {
  const { membership, invoice } = await requireInvoiceAccess(user, invoiceId);
  if (!canTransition(invoice.status, "SENT")) {
    throw new ValidationError("This invoice cannot be marked as sent.");
  }
  assertTransition(invoice.status, "SENT");
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "SENT", sentAt: new Date() },
  });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "INVOICE_SENT",
    entityType: "Invoice",
    entityId: invoice.id,
  });
  const client = await prisma.client.findUnique({ where: { id: invoice.clientId } });
  const to = client?.email.trim() ?? "";
  if (isValidEmail(to)) {
    const currency = getCurrency(invoice.currency);
    try {
      await sendInvoiceEmail({
        to,
        clientName: invoice.clientName,
        businessName: invoice.businessName,
        invoiceNumber: invoice.invoiceNumber,
        publicId: invoice.publicId,
        amountLabel: formatMoney(invoice.totalMinor, currency.symbol, currency.exponent),
        dueLabel: invoice.dueDate.toISOString().slice(0, 10),
        idempotencyKey: `invoice_send:${invoice.id}`,
      });
    } catch {
      logger.warn("invoice_email_failed");
    }
  }
  await notifyOrganizationMembers({
    organizationId: membership.organizationId,
    type: "INVOICE",
    title: "Invoice sent",
    message: `${invoice.invoiceNumber} was marked as sent.`,
    entityType: "Invoice",
    entityId: invoice.id,
  });
  return updated;
}

export async function setInvoiceStatus(user: SessionUser, invoiceId: string, next: InvoiceStatus) {
  const { membership, invoice } = await requireInvoiceAccess(user, invoiceId);
  if (!canTransition(invoice.status, next) || next === "OVERDUE") {
    throw new ValidationError("This status change is not allowed.");
  }
  const data: Prisma.InvoiceUpdateInput = { status: next };
  if (next === "SENT" && !invoice.sentAt) {
    data.sentAt = new Date();
  }
  if (next === "VIEWED" && !invoice.viewedAt) {
    data.viewedAt = new Date();
  }
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data,
  });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "INVOICE_UPDATED",
    entityType: "Invoice",
    entityId: updated.id,
    metadata: { status: next },
  });
  return updated;
}

export async function getPublicInvoice(publicId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice || invoice.status === "DRAFT" || invoice.status === "CANCELED") {
    throw new NotFoundError();
  }
  if (canTransition(invoice.status, "VIEWED")) {
    try {
      const viewed = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "VIEWED",
          viewedAt: invoice.viewedAt ?? new Date(),
        },
      });
      return { ...invoice, ...viewed };
    } catch {
      logger.warn("invoice_view_mark_failed", { invoiceId: invoice.id });
    }
  }
  return invoice;
}

export function serializeInvoice(invoice: InvoiceWithItems | Invoice) {
  const items = "items" in invoice ? invoice.items : [];
  return {
    id: invoice.id,
    publicId: invoice.publicId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    issueDate: invoice.issueDate.toISOString().slice(0, 10),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    clientName: invoice.clientName,
    clientAddress: invoice.clientAddress,
    businessName: invoice.businessName,
    businessAddress: invoice.businessAddress,
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
    taxRate: invoice.taxRate,
    notes: invoice.notes,
    paymentDetails: invoice.paymentDetails,
    template: invoice.template,
    accentColor: invoice.accentColor,
    subtotalMinor: invoice.subtotalMinor.toString(),
    discountAmountMinor: invoice.discountAmountMinor.toString(),
    taxAmountMinor: invoice.taxAmountMinor.toString(),
    totalMinor: invoice.totalMinor.toString(),
    sentAt: invoice.sentAt?.toISOString() ?? null,
    viewedAt: invoice.viewedAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      description: item.description,
      quantityMinor: item.quantityMinor.toString(),
      unitPriceMinor: item.unitPriceMinor.toString(),
      amountMinor: item.amountMinor.toString(),
      sortOrder: item.sortOrder,
    })),
  };
}
