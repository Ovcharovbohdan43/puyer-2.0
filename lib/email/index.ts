import "server-only";

import type { OutboundEmail } from "@/lib/email/types";
import { puyerEmailHtml, puyerParagraph } from "@/lib/email/layout";
import { deliverEmail } from "@/lib/email/resend";
import { ValidationError } from "@/lib/errors";
import { helpAckHtmlParagraphs, helpAckText, helpCenterUrl } from "@/lib/help/ack";
import { helpFromAddress, helpInboxAddress } from "@/lib/help/from";
import type { HelpTopic } from "@/lib/help/input";
import { emailMailbox, envString } from "@/lib/email/env";
import { logger } from "@/lib/observability/logger";
import { appBaseUrl } from "@/lib/stripe/client";
import type { ReminderKind } from "@/lib/reminders/evaluate";
import { reminderBodyLines, reminderFromAddress } from "@/lib/reminders/message";
import { inviteAcceptUrl, inviteFromAddress } from "@/lib/team/invite-email";
import { deletionAckText, deletionInboxText } from "@/lib/account/notice";
import {
  billingNoticeCopy,
  emailChangeRequestedCopy,
  passwordChangedCopy,
  type BillingNoticeKind,
  type BillingSnapshot,
} from "@/lib/email/lifecycle";
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
  const from = inviteFromAddress();
  const message = {
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
  };
  try {
    return await deliverEmail({
      ...message,
      from,
      idempotencyKey: input.idempotencyKey,
    });
  } catch (error) {
    const verifiedMailbox =
      emailMailbox(envString("EMAIL_FROM")) ||
      emailMailbox(envString("EMAIL_FROM_HELP")) ||
      emailMailbox(envString("EMAIL_FROM_REMINDERS"));
    const retryFrom =
      verifiedMailbox && !from.toLowerCase().includes(verifiedMailbox.toLowerCase())
        ? `Puyer Team <${verifiedMailbox}>`
        : null;
    if (retryFrom) {
      try {
        return await deliverEmail({
          ...message,
          from: retryFrom,
          idempotencyKey: `${input.idempotencyKey}:verified-from`,
        });
      } catch (retryError) {
        logger.error("team_invite_email_failed", {
          errorName: retryError instanceof Error ? retryError.message : "unknown",
          fromRetry: true,
        });
        throw new ValidationError("The invitation email could not be sent. Try again in a moment.");
      }
    }
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("team_invite_email_failed", {
      errorName: error instanceof Error ? error.message : "unknown",
      from,
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

export async function sendAccountDeletionEmails(input: {
  requestId: string;
  email: string;
  name: string;
  reason: string;
  organizationName: string;
}) {
  const from = helpFromAddress();
  const inbox = helpInboxAddress();
  await deliverEmail({
    to: inbox,
    from,
    subject: `Account deletion request (${input.requestId.slice(0, 8)})`,
    text: deletionInboxText(input),
    html: puyerEmailHtml({
      preview: "Account deletion request",
      heading: "Account deletion request",
      bodyHtml:
        puyerParagraph(`User: ${input.name} <${input.email}>`) +
        puyerParagraph(`Workspace: ${input.organizationName}`) +
        puyerParagraph(`Reference: ${input.requestId}`) +
        puyerParagraph(input.reason),
    }),
    idempotencyKey: `account-deletion-inbox:${input.requestId}`,
  });
  return deliverEmail({
    to: input.email,
    from,
    subject: "We received your Puyer account deletion request",
    text: deletionAckText({ name: input.name, requestId: input.requestId }),
    html: puyerEmailHtml({
      preview: "We received your account deletion request",
      heading: "Deletion request received",
      bodyHtml: puyerParagraph(deletionAckText({ name: input.name, requestId: input.requestId })),
      ctaLabel: "Open Help Center",
      ctaUrl: helpCenterUrl(),
    }),
    idempotencyKey: `account-deletion-ack:${input.requestId}`,
  });
}

function accountMailFrom(): string {
  const general = envString("EMAIL_FROM");
  if (general.includes("@")) {
    return general;
  }
  return `Puyer <${helpInboxAddress()}>`;
}

async function sendBrandedNotice(input: {
  to: string;
  idempotencyKey: string;
  copy: {
    subject: string;
    heading: string;
    preview: string;
    paragraphs: string[];
    ctaLabel: string;
    ctaUrl: string;
  };
}) {
  return deliverEmail({
    to: input.to,
    from: accountMailFrom(),
    subject: input.copy.subject,
    text: `${input.copy.paragraphs.join("\n\n")}\n${input.copy.ctaUrl}`,
    html: puyerEmailHtml({
      preview: input.copy.preview,
      heading: input.copy.heading,
      bodyHtml: input.copy.paragraphs.map((line) => puyerParagraph(line)).join(""),
      ctaLabel: input.copy.ctaLabel,
      ctaUrl: input.copy.ctaUrl,
    }),
    idempotencyKey: input.idempotencyKey,
  });
}

export async function sendPasswordChangedEmail(input: {
  to: string;
  recipientName: string;
  idempotencyKey: string;
}) {
  return sendBrandedNotice({
    to: input.to,
    idempotencyKey: input.idempotencyKey,
    copy: passwordChangedCopy({
      recipientName: input.recipientName,
      settingsUrl: `${appBaseUrl()}/settings`,
      supportEmail: helpInboxAddress(),
    }),
  });
}

export async function sendEmailChangeRequestedEmail(input: {
  to: string;
  recipientName: string;
  newEmail: string;
  idempotencyKey: string;
}) {
  return sendBrandedNotice({
    to: input.to,
    idempotencyKey: input.idempotencyKey,
    copy: emailChangeRequestedCopy({
      recipientName: input.recipientName,
      newEmail: input.newEmail,
      settingsUrl: `${appBaseUrl()}/settings`,
      supportEmail: helpInboxAddress(),
    }),
  });
}

export async function sendBillingNoticeEmail(input: {
  to: string;
  recipientName: string;
  workspaceName: string;
  kind: BillingNoticeKind;
  plan: BillingSnapshot["plan"];
  previousPlan?: BillingSnapshot["plan"];
  idempotencyKey: string;
}) {
  return sendBrandedNotice({
    to: input.to,
    idempotencyKey: input.idempotencyKey,
    copy: billingNoticeCopy({
      kind: input.kind,
      plan: input.plan,
      previousPlan: input.previousPlan,
      recipientName: input.recipientName,
      workspaceName: input.workspaceName,
      billingUrl: `${appBaseUrl()}/billing`,
      supportEmail: helpInboxAddress(),
    }),
  });
}
