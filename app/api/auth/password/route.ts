import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/auth/server";
import { toPublicError, ValidationError } from "@/lib/errors";
import { clientIp } from "@/lib/http/ip";
import { assertBrowserOrigin } from "@/lib/http/origin";
import { isValidEmail } from "@/lib/invoices/validate";
import { logger } from "@/lib/observability/logger";
import { consumeRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertBrowserOrigin(request);
    let body: { email?: unknown; password?: unknown };
    try {
      body = (await request.json()) as { email?: unknown; password?: unknown };
    } catch {
      throw new ValidationError("Enter your email and password.");
    }
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!isValidEmail(email) || password.length < 12) {
      throw new ValidationError("Enter your email and password.");
    }
    if (!(await consumeRateLimit("password-login", email.toLowerCase()))) {
      throw new ValidationError("Too many sign-in attempts. Try again later.");
    }
    if (!(await consumeRateLimit("otp-ip", clientIp(request)))) {
      throw new ValidationError("Too many sign-in attempts. Try again later.");
    }
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new ValidationError("Sign-in is not configured yet.");
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logger.warn("password_login_failed");
      throw new ValidationError("Email or password is incorrect.");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const publicError = toPublicError(error);
    return NextResponse.json({ ok: false, error: publicError.message }, { status: publicError.status });
  }
}
