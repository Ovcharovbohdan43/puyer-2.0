import "server-only";

import { Prisma, type ReminderType } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import type { SessionUser } from "@/lib/authorization";
import { requireInvoiceAccess } from "@/lib/authorization/invoice";
import { prisma } from "@/lib/db/prisma";
import { sendReminderEmail } from "@/lib/email";
import { requireEntitlement } from "@/lib/entitlements";
import { loadEffectivePlan } from "@/lib/entitlements/load";
import { ValidationError } from "@/lib/errors";
import { formatMoney } from "@/lib/invoices/money";
import { getCurrency } from "@/lib/invoices/currencies";
import { isValidEmail } from "@/lib/invoices/validate";
import { notifyOrganizationMembers } from "@/lib/notifications";
import { logger } from "@/lib/observability/logger";
import {
  reminderIdempotencyKey,
  shouldSkipReminderStatus,
  utcDateOnly,
  type ReminderKind,
} from "@/lib/reminders/evaluate";

export async function deliverDueReminder(input: {
  invoiceId: string;
  type: ReminderKind;
  scheduledDate: string;
}): Promise<"SENT" | "SKIPPED" | "ALREADY"> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    include: { client: true },
  });
  if (!invoice || shouldSkipReminderStatus(invoice.status)) {
    return "SKIPPED";
  }

  const scheduledDate = utcDateOnly(new Date(`${input.scheduledDate}T00:00:00.000Z`));
  const claimed = await claimReminder({
    organizationId: invoice.organizationId,
    invoiceId: invoice.id,
    type: input.type,
    scheduledDate,
  });
  if (claimed === "ALREADY") {
    return "ALREADY";
  }

  const fresh = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  if (!fresh || shouldSkipReminderStatus(fresh.status)) {
    await prisma.reminderEvent.update({
      where: { id: claimed.id },
      data: { status: "SKIPPED" },
    });
    return "SKIPPED";
  }

  const to = invoice.client.email.trim();
  if (!isValidEmail(to)) {
    await prisma.reminderEvent.update({
      where: { id: claimed.id },
      data: { status: "SKIPPED" },
    });
    return "SKIPPED";
  }

  const currency = getCurrency(invoice.currency);
  const amountLabel = formatMoney(invoice.totalMinor, currency.symbol, currency.exponent);
  const dueLabel = utcDateOnly(invoice.dueDate).toISOString().slice(0, 10);
  const result = await sendReminderEmail({
    to,
    clientName: invoice.clientName,
    businessName: invoice.businessName,
    invoiceNumber: invoice.invoiceNumber,
    publicId: invoice.publicId,
    amountLabel,
    dueLabel,
    type: input.type,
    idempotencyKey: reminderIdempotencyKey(invoice.id, input.type, scheduledDate),
  });
  if (result.skipped) {
    await prisma.reminderEvent.update({
      where: { id: claimed.id },
      data: { status: "SKIPPED" },
    });
    logger.warn("reminder_email_unconfigured");
    return "SKIPPED";
  }

  await prisma.reminderEvent.update({
    where: { id: claimed.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      providerMessageId: result.providerMessageId,
    },
  });
  await notifyOrganizationMembers({
    organizationId: invoice.organizationId,
    type: "REMINDER",
    title: "Payment reminder sent",
    message: `A reminder for ${invoice.invoiceNumber} was emailed to the client.`,
    entityType: "Invoice",
    entityId: invoice.id,
  });
  await writeAuditLog({
    organizationId: invoice.organizationId,
    action: "REMINDER_SENT",
    entityType: "Invoice",
    entityId: invoice.id,
  });
  return "SENT";
}

export async function sendManualReminder(user: SessionUser, invoiceId: string, customBody: string) {
  const { membership, invoice } = await requireInvoiceAccess(user, invoiceId);
  const plan = await loadEffectivePlan(membership.organizationId);
  requireEntitlement({ plan }, "AUTOMATIC_REMINDERS");
  if (shouldSkipReminderStatus(invoice.status)) {
    throw new ValidationError("Reminders are not sent for this invoice status.");
  }
  const to = invoice.client.email.trim();
  if (!isValidEmail(to)) {
    throw new ValidationError("Add a valid client email before sending a reminder.");
  }
  const scheduledDate = utcDateOnly(new Date());
  const claimed = await claimReminder({
    organizationId: membership.organizationId,
    invoiceId: invoice.id,
    type: "MANUAL",
    scheduledDate,
  });
  if (claimed === "ALREADY") {
    throw new ValidationError("A reminder was already sent for this invoice today.");
  }

  const currency = getCurrency(invoice.currency);
  const amountLabel = formatMoney(invoice.totalMinor, currency.symbol, currency.exponent);
  const dueLabel = utcDateOnly(invoice.dueDate).toISOString().slice(0, 10);
  const result = await sendReminderEmail({
    to,
    clientName: invoice.clientName,
    businessName: invoice.businessName,
    invoiceNumber: invoice.invoiceNumber,
    publicId: invoice.publicId,
    amountLabel,
    dueLabel,
    type: "MANUAL",
    customBody,
    idempotencyKey: reminderIdempotencyKey(invoice.id, "MANUAL", scheduledDate),
  });
  if (result.skipped) {
    await prisma.reminderEvent.update({
      where: { id: claimed.id },
      data: { status: "SKIPPED" },
    });
    throw new ValidationError("Email is not configured. Reminders need Resend and reminders@puyer.org.");
  }

  await prisma.reminderEvent.update({
    where: { id: claimed.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      providerMessageId: result.providerMessageId,
    },
  });
  await notifyOrganizationMembers({
    organizationId: membership.organizationId,
    type: "REMINDER",
    title: "Payment reminder sent",
    message: `A reminder for ${invoice.invoiceNumber} was emailed to the client.`,
    entityType: "Invoice",
    entityId: invoice.id,
  });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "REMINDER_SENT",
    entityType: "Invoice",
    entityId: invoice.id,
    metadata: { manual: true },
  });
}

async function claimReminder(input: {
  organizationId: string;
  invoiceId: string;
  type: ReminderType;
  scheduledDate: Date;
}) {
  const existing = await prisma.reminderEvent.findUnique({
    where: {
      invoiceId_type_scheduledDate: {
        invoiceId: input.invoiceId,
        type: input.type,
        scheduledDate: input.scheduledDate,
      },
    },
  });
  if (existing?.status === "SENT") {
    return "ALREADY" as const;
  }
  if (existing?.status === "SKIPPED" && input.type !== "MANUAL") {
    return "ALREADY" as const;
  }
  if (existing) {
    return existing;
  }
  try {
    return await prisma.reminderEvent.create({
      data: {
        organizationId: input.organizationId,
        invoiceId: input.invoiceId,
        type: input.type,
        scheduledDate: input.scheduledDate,
        status: "SCHEDULED",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "ALREADY" as const;
    }
    throw error;
  }
}
