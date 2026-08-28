import "server-only";

import type { OutboundEmail } from "@/lib/email/types";
import { puyerEmailHtml, puyerParagraph } from "@/lib/email/layout";
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
  const safeName = input.clientName || "there";
  const lead = `${input.businessName} sent invoice ${input.invoiceNumber} for ${input.amountLabel}, due ${input.dueLabel}.`;
  return deliverEmail({
    to: input.to,
    subject: `Invoice ${input.invoiceNumber} from ${input.businessName}`,
    text: `${input.businessName} sent invoice ${input.invoiceNumber} (${input.amountLabel}), due ${input.dueLabel}. View: ${url}`,
    html: puyerEmailHtml({
      preview: `Invoice ${input.invoiceNumber} from ${input.businessName}`,
      heading: `Invoice ${input.invoiceNumber}`,
      bodyHtml: puyerParagraph(`Hi ${safeName},`) + puyerParagraph(lead),
      ctaLabel: "View invoice",
      ctaUrl: url,
    }),
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
  const subject =
    input.type === "BEFORE_DUE"
      ? `Reminder: invoice ${input.invoiceNumber} is due ${input.dueLabel}`
      : input.type === "ON_DUE"
        ? `Invoice ${input.invoiceNumber} is due today`
        : `Invoice ${input.invoiceNumber} is past due`;
  const lead =
    input.type === "BEFORE_DUE"
      ? `This is a reminder that invoice ${input.invoiceNumber} from ${input.businessName} is due ${input.dueLabel}.`
      : input.type === "ON_DUE"
        ? `Invoice ${input.invoiceNumber} from ${input.businessName} is due today.`
        : `Invoice ${input.invoiceNumber} from ${input.businessName} is past due.`;
  return {
    to: input.to,
    subject,
    text: `${input.businessName}: ${subject}. Amount ${input.amountLabel}. View: ${url}`,
    html: puyerEmailHtml({
      preview: subject,
      heading: subject,
      bodyHtml:
        puyerParagraph(`Hi ${input.clientName || "there"},`) +
        puyerParagraph(`${lead} Amount due: ${input.amountLabel}.`),
      ctaLabel: "View invoice",
      ctaUrl: url,
    }),
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
  return deliverEmail({
    to: input.to,
    subject: `Join ${input.orgName} on Puyer`,
    text: `You were invited to the ${input.orgName} workspace on Puyer. Accept: ${url}`,
    html: puyerEmailHtml({
      preview: `Join ${input.orgName} on Puyer`,
      heading: "You’re invited to Puyer",
      bodyHtml: puyerParagraph(`You were invited to join ${input.orgName} on Puyer.`),
      ctaLabel: "Accept invitation",
      ctaUrl: url,
    }),
    idempotencyKey: input.idempotencyKey,
  });
}
