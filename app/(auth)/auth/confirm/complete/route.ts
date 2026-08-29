import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { completeMagicLinkSession } from "@/lib/auth/complete-magic-link";
import { loginUrl } from "@/lib/auth/login-path";
import { requestPublicOrigin } from "@/lib/auth/public-origin";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { logger } from "@/lib/observability/logger";

const RETURN_COOKIE = "puyer-auth-return";

export async function POST(request: Request) {
  const origin = requestPublicOrigin(request);
  const form = await request.formData();
  const searchParams = new URLSearchParams();
  for (const key of ["code", "token_hash", "token", "type", "next"] as const) {
    const value = form.get(key);
    if (typeof value === "string" && value.length > 0) {
      searchParams.set(key, value);
    }
  }

  const cookieStore = await cookies();
  const returnTo = sanitizeReturnTo(searchParams.get("next") ?? cookieStore.get(RETURN_COOKIE)?.value);
  cookieStore.delete(RETURN_COOKIE);

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(new URL(loginUrl({ error: true }), origin), 303);
  }

  const result = await completeMagicLinkSession(supabase, searchParams);
  if (!result.ok) {
    logger.warn("auth_confirm_failed", { error: result.error });
    return NextResponse.redirect(new URL(loginUrl({ error: true }), origin), 303);
  }
  return NextResponse.redirect(new URL(returnTo, origin), 303);
}
