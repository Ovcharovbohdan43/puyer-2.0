import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/auth/server";
import { normalizeOtpEmail } from "@/lib/auth/otp-limit";
import { magicLinkEmailRedirectTo } from "@/lib/auth/public-origin";
import { returnToForIntent, sanitizeReturnTo, type AuthIntent } from "@/lib/auth/return-to";
import { toPublicError, ValidationError } from "@/lib/errors";
import { clientIp } from "@/lib/http/ip";
import { assertBrowserOrigin } from "@/lib/http/origin";
import { isValidEmail } from "@/lib/invoices/validate";
import { logger } from "@/lib/observability/logger";
import { consumeRateLimit } from "@/lib/rate-limit/consume";

const RETURN_COOKIE = "puyer-auth-return";

function parseIntent(value: unknown): AuthIntent {
  if (value === "download" || value === "share" || value === "login" || value === "subscribe") {
    return value;
  }
  return "login";
}

export async function POST(request: Request) {
  try {
    assertBrowserOrigin(request);
    let body: { email?: unknown; intent?: unknown; returnTo?: unknown };
    try {
      body = (await request.json()) as { email?: unknown; intent?: unknown };
    } catch {
      throw new ValidationError("Enter a valid email address.");
    }
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!isValidEmail(email)) {
      throw new ValidationError("Enter a valid email address.");
    }

    if (!(await consumeRateLimit("otp-email", normalizeOtpEmail(email)))) {
      throw new ValidationError("Too many sign-in attempts. Try again later.");
    }
    if (!(await consumeRateLimit("otp-ip", clientIp(request)))) {
      throw new ValidationError("Too many sign-in attempts. Try again later.");
    }

    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      logger.warn("otp_skipped_unconfigured");
      throw new ValidationError("Sign-in is not configured yet.");
    }

    const intent = parseIntent(body.intent);
    const requested =
      body && typeof body === "object" && "returnTo" in body && typeof body.returnTo === "string"
        ? body.returnTo
        : returnToForIntent(intent);
    const returnTo = sanitizeReturnTo(requested);
    const cookieStore = await cookies();
    const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    cookieStore.set(RETURN_COOKIE, returnTo, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
      secure,
    });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: magicLinkEmailRedirectTo(request),
        shouldCreateUser: true,
      },
    });

    if (error) {
      logger.warn("otp_send_failed");
      throw new ValidationError("Could not send the sign-in link. Try again.");
    }

    logger.info("otp_sent");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const publicError = toPublicError(error);
    return NextResponse.json({ ok: false, error: publicError.message }, { status: publicError.status });
  }
}
