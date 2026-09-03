import "server-only";

import { connection } from "next/server";
import { Resend } from "resend";

import { envString, findResendApiKey, linuxEnvironSize, listResendEnvNames } from "@/lib/email/env";
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
  const apiKey = findResendApiKey();
  const from = message.from?.trim() || envString("EMAIL_FROM");
  if (!apiKey || !from.includes("@")) {
    logger.warn("email_skipped_unconfigured", {
      keyPresent: Boolean(apiKey),
      fromPresent: from.includes("@"),
      resendNames: listResendEnvNames(),
      linuxEnvKeys: linuxEnvironSize(),
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
    throw new Error(`email_provider_rejected:${error.name}`);
  }
  return { skipped: false, providerMessageId: data?.id ?? null };
}
