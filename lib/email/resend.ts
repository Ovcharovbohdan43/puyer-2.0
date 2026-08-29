import "server-only";

import { Resend } from "resend";

import type { EmailSendResult, OutboundEmail } from "@/lib/email/types";
import { logger } from "@/lib/observability/logger";

export async function deliverEmail(message: OutboundEmail): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = message.from?.trim() || process.env.EMAIL_FROM?.trim() || "";
  if (!apiKey || !from.includes("@")) {
    logger.warn("email_skipped_unconfigured");
    return { skipped: true, providerMessageId: null };
  }
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    {
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    },
    { idempotencyKey: message.idempotencyKey.slice(0, 256) },
  );
  if (error) {
    throw new Error(error.message);
  }
  return { skipped: false, providerMessageId: data?.id ?? null };
}
