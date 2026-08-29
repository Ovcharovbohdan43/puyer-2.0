import "server-only";

import { Resend } from "resend";

import { envString } from "@/lib/email/env";
import type { EmailSendResult, OutboundEmail } from "@/lib/email/types";
import { logger } from "@/lib/observability/logger";

async function bindRequestRuntime(): Promise<void> {
  try {
    const { connection } = await import("next/server");
    await connection();
  } catch {
    // Inngest, Vitest, and other non-request workers still read process.env below.
  }
}

export async function deliverEmail(message: OutboundEmail): Promise<EmailSendResult> {
  await bindRequestRuntime();
  const apiKey = envString("RESEND_API_KEY");
  const from = message.from?.trim() || envString("EMAIL_FROM");
  if (!apiKey || !from.includes("@")) {
    logger.warn("email_skipped_unconfigured", {
      hasApiKey: Boolean(apiKey),
      hasFrom: from.includes("@"),
    });
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
      ...(message.replyTo?.includes("@") ? { replyTo: message.replyTo } : {}),
    },
    { idempotencyKey: message.idempotencyKey.slice(0, 256) },
  );
  if (error) {
    logger.error("email_provider_rejected", { errorName: error.name });
    throw new Error("email_provider_rejected");
  }
  return { skipped: false, providerMessageId: data?.id ?? null };
}
