import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { parseAccountEmailBody } from "@/lib/account/input";
import { writeAuditLog } from "@/lib/audit";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { requireOrganization } from "@/lib/authorization";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { logger } from "@/lib/observability/logger";
import { requireRateLimit } from "@/lib/rate-limit/consume";

const RETURN_COOKIE = "puyer-auth-return";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("account-email", user.id);
    const membership = await requireOrganization(user);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const email = parseAccountEmailBody(body, user.email);
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (taken) {
      throw new ValidationError("That email is already in use.");
    }
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new ValidationError("Sign-in is not configured yet.");
    }
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      logger.warn("account_email_change_failed");
      throw new ValidationError("Could not start the email change. Try again.");
    }
    const cookieStore = await cookies();
    const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    cookieStore.set(RETURN_COOKIE, "/settings", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
      secure,
    });
    await writeAuditLog({
      actorUserId: user.id,
      organizationId: membership.organizationId,
      action: "ACCOUNT_EMAIL_CHANGE_REQUESTED",
      entityType: "User",
      entityId: user.id,
    });
    return NextResponse.json({ ok: true });
  }, request);
}
