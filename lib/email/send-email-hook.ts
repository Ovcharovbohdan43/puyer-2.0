import { Webhook, WebhookVerificationError } from "standardwebhooks";

import { authEmailMessage } from "@/lib/email/auth-templates";
import { deliverEmail } from "@/lib/email/resend";
import { logger } from "@/lib/observability/logger";
import { trySupabasePublicEnv } from "@/utils/supabase/env";

export function parseSendEmailHookSecret(value: string): string {
  return value.trim().replace(/^v1,/, "");
}

type AuthHookPayload = {
  user?: { email?: string };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
  };
};

function jsonError(status: number, message: string): Response {
  return Response.json({ error: { http_code: status, message } }, { status });
}

export async function handleSendEmailHook(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonError(400, "Method not allowed.");
  }
  const rawSecret = process.env.SEND_EMAIL_HOOK_SECRET?.trim() ?? "";
  if (!rawSecret) {
    logger.warn("auth_email_hook_unconfigured");
    return jsonError(503, "Send Email hook is not configured.");
  }
  const supabase = trySupabasePublicEnv();
  if (!supabase) {
    return jsonError(503, "Supabase is not configured.");
  }

  const payload = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
  };

  let verified: AuthHookPayload;
  try {
    verified = new Webhook(parseSendEmailHookSecret(rawSecret)).verify(payload, headers) as AuthHookPayload;
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      logger.warn("auth_email_hook_invalid_signature");
      return jsonError(401, "Invalid signature.");
    }
    throw error;
  }

  const to = verified.user?.email?.trim() ?? "";
  const action = verified.email_data?.email_action_type?.trim() ?? "magiclink";
  const token = verified.email_data?.token ?? "";
  const tokenHash = verified.email_data?.token_hash ?? "";
  const redirectTo = verified.email_data?.redirect_to?.trim() || `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`;
  if (!to || !tokenHash) {
    return jsonError(400, "Invalid email payload.");
  }

  const result = await deliverEmail(
    authEmailMessage({
      to,
      action,
      token,
      tokenHash,
      redirectTo,
      supabaseUrl: supabase.url,
      idempotencyKey: `auth-email:${to}:${action}:${tokenHash}`.slice(0, 256),
    }),
  );
  if (result.skipped) {
    logger.warn("auth_email_skipped_resend_unconfigured", { action });
    return jsonError(503, "Resend is not configured.");
  }
  logger.info("auth_email_sent", { action });
  return Response.json({});
}
