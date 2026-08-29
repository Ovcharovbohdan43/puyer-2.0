import "server-only";

import { connection } from "next/server";
import { Resend } from "resend";

import type { EmailSendResult, OutboundEmail } from "@/lib/email/types";
import { logger } from "@/lib/observability/logger";

async function bindRequestRuntime(): Promise<void> {
  try {
    await connection();
  } catch {
    // Inngest, Vitest, and other non-request workers still read process.env below.
  }
}

export async function deliverEmail(message: OutboundEmail): Promise<EmailSendResult> {
  await bindRequestRuntime();
  // Static process.env.* (not process.env[name]) so Next includes these in the Vercel function.
  const apiKey = process.env.RESEND_API_KEY?.trim() || process.env.RESEND_KEY?.trim() || "";
  const from = message.from?.trim() || process.env.EMAIL_FROM?.trim() || "";
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
