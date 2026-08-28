import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/auth/server";
import { toPublicError } from "@/lib/errors";
import { assertBrowserOrigin } from "@/lib/http/origin";
import { logger } from "@/lib/observability/logger";

export async function POST(request: Request) {
  try {
    assertBrowserOrigin(request);
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn("auth_sign_out_failed");
        throw error;
      }
    }
    logger.info("auth_signed_out");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const publicError = toPublicError(error);
    return NextResponse.json({ ok: false, error: publicError.message }, { status: publicError.status });
  }
}
