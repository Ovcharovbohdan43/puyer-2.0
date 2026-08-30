import "server-only";

import type { OutboundEmail } from "@/lib/email/types";
import { puyerEmailHtml, puyerParagraph } from "@/lib/email/layout";
import { deliverEmail } from "@/lib/email/resend";
import { ValidationError } from "@/lib/errors";
import { helpAckHtmlParagraphs, helpAckText, helpCenterUrl } from "@/lib/help/ack";
import { helpFromAddress, helpInboxAddress } from "@/lib/help/from";
import type { HelpTopic } from "@/lib/help/input";
import { envString } from "@/lib/email/env";
import { logger } from "@/lib/observability/logger";
import { appBaseUrl } from "@/lib/stripe/client";
import type { ReminderKind } from "@/lib/reminders/evaluate";
import { reminderBodyLines, reminderFromAddress } from "@/lib/reminders/message";
import { inviteAcceptUrl, inviteFromAddress } from "@/lib/team/invite-email";
import { banNoticeParagraphs, banNoticeSubject, banNoticeText } from "@/lib/moderation/notice";

export async function sendReminderEmail(input: {
  to: string;
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  publicId: string;
  amountLabel: string;
  dueLabel: string;
  type: ReminderKind | "MANUAL";
  idempotencyKey: string;
  customBody?: string;
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
  type: ReminderKind | "MANUAL";
  idempotencyKey: string;
  customBody?: string;
}): OutboundEmail {
  const url = publicInvoiceUrl(input.publicId);
  const subject =
    input.type === "BEFORE_DUE"
      ? `Reminder: invoice ${input.invoiceNumber} is due ${input.dueLabel}`
      : input.type === "ON_DUE"
        ? `Invoice ${input.invoiceNumber} is due today`
        : input.type === "AFTER_DUE"
          ? `Invoice ${input.invoiceNumber} is past due`
          : `Reminder: invoice ${input.invoiceNumber}`;
  const customLines = reminderBodyLines(input.customBody ?? "");
  const lead =
    input.type === "BEFORE_DUE"
      ? `This is a reminder that invoice ${input.invoiceNumber} from ${input.businessName} is due ${input.dueLabel}.`
      : input.type === "ON_DUE"
        ? `Invoice ${input.invoiceNumber} from ${input.businessName} is due today.`
        : input.type === "AFTER_DUE"
          ? `Invoice ${input.invoiceNumber} from ${input.businessName} is past due.`
          : `This is a reminder from ${input.businessName} about invoice ${input.invoiceNumber}, due ${input.dueLabel}.`;
  const bodyLines = customLines.length > 0 ? customLines : [lead, `Amount due: ${input.amountLabel}.`];
  const textBody = bodyLines.join("\n");
  return {
    to: input.to,
    from: reminderFromAddress(),
    subject,
    text: `${textBody}\nView: ${url}`,
    html: puyerEmailHtml({
      preview: subject,
      heading: subject,
      bodyHtml: puyerParagraph(`Hi ${input.clientName || "there"},`) + bodyLines.map((line) => puyerParagraph(line)).join(""),
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
  appOrigin: string;
}) {
  const url = inviteAcceptUrl(input.appOrigin, input.token);
  try {
    return await deliverEmail({
      to: input.to,
      from: inviteFromAddress(),
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
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("team_invite_email_failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    throw new ValidationError("The invitation email could not be sent. Try again in a moment.");
  }
}

export async function sendHelpInboxEmail(input: {
  requestId: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  signedIn: boolean;
}) {
  const sessionLine = input.signedIn ? "Signed in: yes" : "Signed in: no";
  const text = [
    `Help request ${input.requestId}`,
    `From: ${input.name} <${input.email}>`,
    `Topic: ${input.topic}`,
    sessionLine,
    "",
    input.message,
  ].join("\n");
  const messageHtml = input.message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => puyerParagraph(line))
    .join("");
  return deliverEmail({
    to: helpInboxAddress(),
    from: helpFromAddress(),
    replyTo: input.email,
    subject: `Help: ${input.topic} from ${input.email}`,
    text,
    html: puyerEmailHtml({
      preview: `Help request ${input.requestId}`,
      heading: "New help request",
      bodyHtml:
        puyerParagraph(`Request ${input.requestId}`) +
        puyerParagraph(`From: ${input.name} <${input.email}>`) +
        puyerParagraph(`Topic: ${input.topic}. ${sessionLine}.`) +
        messageHtml,
    }),
    idempotencyKey: `help-inbox:${input.requestId}`,
  });
}

export async function sendHelpAckEmail(input: {
  requestId: string;
  name: string;
  email: string;
  topic: HelpTopic;
}) {
  return deliverEmail({
    to: input.email,
    from: helpFromAddress(),
    subject: `We received your Puyer help request (${input.requestId.slice(0, 8)})`,
    text: helpAckText(input),
    html: puyerEmailHtml({
      preview: "We received your help request and will reply by email",
      heading: "We received your request",
      bodyHtml: helpAckHtmlParagraphs(input)
        .map((line) => puyerParagraph(line))
        .join(""),
      ctaLabel: "Open Help Center",
      ctaUrl: helpCenterUrl(),
    }),
    idempotencyKey: `help-ack:${input.requestId}`,
  });
}

function banNoticeFromAddress(): string {
  const general = envString("EMAIL_FROM");
  if (general.includes("@")) {
    return general;
  }
  return `Puyer <${helpInboxAddress()}>`;
}

export async function sendBanNoticeEmail(input: {
  to: string;
  recipientName: string;
  kind: "TEMPORARY" | "PERMANENT";
  reason: string;
  endsAt: Date | null;
  idempotencyKey: string;
}) {
  const payload = {
    recipientName: input.recipientName,
    kind: input.kind,
    reason: input.reason,
    endsAt: input.endsAt,
    helpUrl: helpCenterUrl(),
    supportEmail: helpInboxAddress(),
  };
  return deliverEmail({
    to: input.to,
    from: banNoticeFromAddress(),
    subject: banNoticeSubject(input.kind),
    text: banNoticeText(payload),
    html: puyerEmailHtml({
      preview: banNoticeSubject(input.kind),
      heading: "Official account notice",
      bodyHtml: banNoticeParagraphs(payload)
        .map((line) => puyerParagraph(line))
        .join(""),
      ctaLabel: "Open Help Center",
      ctaUrl: helpCenterUrl(),
    }),
    idempotencyKey: input.idempotencyKey,
  });
}
