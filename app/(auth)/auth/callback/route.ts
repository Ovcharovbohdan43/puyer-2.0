import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { loginUrl } from "@/lib/auth/login-path";
import { requestPublicOrigin } from "@/lib/auth/public-origin";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { logger } from "@/lib/observability/logger";

const RETURN_COOKIE = "puyer-auth-return";

const OTP_TYPES = new Set<string>([
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const origin = requestPublicOrigin(request);
  const cookieStore = await cookies();
  const returnTo = sanitizeReturnTo(
    url.searchParams.get("next") ?? cookieStore.get(RETURN_COOKIE)?.value,
  );
  cookieStore.delete(RETURN_COOKIE);

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(new URL(loginUrl({ error: true }), origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.warn("auth_callback_exchange_failed");
      return NextResponse.redirect(new URL(loginUrl({ error: true }), origin));
    }
    return NextResponse.redirect(new URL(returnTo, origin));
  }

  if (tokenHash && type && OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      logger.warn("auth_callback_verify_failed");
      return NextResponse.redirect(new URL(loginUrl({ error: true }), origin));
    }
    return NextResponse.redirect(new URL(returnTo, origin));
  }

  logger.warn("auth_callback_missing_code");
  return NextResponse.redirect(new URL(loginUrl({ error: true }), origin));
}
