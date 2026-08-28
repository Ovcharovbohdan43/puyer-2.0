import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/auth/server";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { logger } from "@/lib/observability/logger";

const RETURN_COOKIE = "puyer-auth-return";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  const cookieStore = await cookies();
  const returnTo = sanitizeReturnTo(cookieStore.get(RETURN_COOKIE)?.value);
  cookieStore.delete(RETURN_COOKIE);

  if (!code) {
    logger.warn("auth_callback_missing_code");
    return NextResponse.redirect(new URL("/?login=1", origin));
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/?login=1", origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logger.warn("auth_callback_exchange_failed");
    return NextResponse.redirect(new URL("/?login=1", origin));
  }

  return NextResponse.redirect(new URL(returnTo, origin));
}
