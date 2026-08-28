import "server-only";

import { escapeHtml, type OutboundEmail } from "@/lib/email/types";
import { deliverEmail } from "@/lib/email/resend";
import { appBaseUrl } from "@/lib/stripe/client";
import type { ReminderKind } from "@/lib/reminders/evaluate";

export async function sendReminderEmail(input: {
  to: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  publicId: string;
  amountLabel: string;
  dueLabel: string;
  type: ReminderKind;
  idempotencyKey: string;
}) {
  return deliverEmail(reminderMessage(input));
}

export async function sendInvoiceEmail(input: {
  to: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  publicId: string;
  amountLabel: string;
  dueLabel: string;
  idempotencyKey: string;
}) {
  const url = publicInvoiceUrl(input.publicId);
  const safeName = escapeHtml(input.clientName || "there");
  const safeBiz = escapeHtml(input.businessName);
  const safeNumber = escapeHtml(input.invoiceNumber);
  return deliverEmail({
    to: input.to,
    subject: `Invoice ${input.invoiceNumber} from ${input.businessName}`,
    text: `${input.businessName} sent invoice ${input.invoiceNumber} (${input.amountLabel}), due ${input.dueLabel}. View: ${url}`,
    html: `<p>Hi ${safeName},</p><p>${safeBiz} sent invoice <strong>${safeNumber}</strong> for ${escapeHtml(input.amountLabel)}, due ${escapeHtml(input.dueLabel)}.</p><p><a href="${escapeHtml(url)}">View invoice</a></p>`,
    idempotencyKey: input.idempotencyKey,
  });
}

function reminderMessage(input: {
  to: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  publicId: string;
  amountLabel: string;
  dueLabel: string;
  type: ReminderKind;
  idempotencyKey: string;
}): OutboundEmail {
  const url = publicInvoiceUrl(input.publicId);
  const safeName = escapeHtml(input.clientName || "there");
  const safeBiz = escapeHtml(input.businessName);
  const safeNumber = escapeHtml(input.invoiceNumber);
  const subject =
    input.type === "BEFORE_DUE"
      ? `Reminder: invoice ${input.invoiceNumber} is due ${input.dueLabel}`
      : input.type === "ON_DUE"
        ? `Invoice ${input.invoiceNumber} is due today`
        : `Invoice ${input.invoiceNumber} is past due`;
  const lead =
    input.type === "BEFORE_DUE"
      ? `This is a reminder that invoice ${safeNumber} from ${safeBiz} is due ${escapeHtml(input.dueLabel)}.`
      : input.type === "ON_DUE"
        ? `Invoice ${safeNumber} from ${safeBiz} is due today.`
        : `Invoice ${safeNumber} from ${safeBiz} is past due.`;
  return {
    to: input.to,
    subject,
    text: `${input.businessName}: ${subject}. Amount ${input.amountLabel}. View: ${url}`,
    html: `<p>Hi ${safeName},</p><p>${lead} Amount due: ${escapeHtml(input.amountLabel)}.</p><p><a href="${escapeHtml(url)}">View invoice</a></p>`,
    idempotencyKey: input.idempotencyKey,
  };
}

function publicInvoiceUrl(publicId: string): string {
  return `${appBaseUrl()}/invoice/${encodeURIComponent(publicId)}`;
}

export async function sendInviteEmail(input: {
  to: string;
  orgName: string;
  token: string;
  idempotencyKey: string;
}) {
  const url = `${appBaseUrl()}/invite/${encodeURIComponent(input.token)}`;
  const safeOrg = escapeHtml(input.orgName);
  return deliverEmail({
    to: input.to,
    subject: `Join ${input.orgName} on Puyer`,
    text: `You were invited to the ${input.orgName} workspace on Puyer. Accept: ${url}`,
    html: `<p>You were invited to join <strong>${safeOrg}</strong> on Puyer.</p><p><a href="${escapeHtml(url)}">Accept invitation</a></p>`,
    idempotencyKey: input.idempotencyKey,
  });
}
