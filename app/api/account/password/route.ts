import { NextResponse } from "next/server";

import { parseAccountPasswordBody } from "@/lib/account/input";
import { writeAuditLog } from "@/lib/audit";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { requireOrganization } from "@/lib/authorization";
import { sendPasswordChangedEmail } from "@/lib/email";
import { ValidationError } from "@/lib/errors";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { logger } from "@/lib/observability/logger";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("account-password", user.id);
    const membership = await requireOrganization(user);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const parsed = parseAccountPasswordBody(body);
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      throw new ValidationError("Sign-in is not configured yet.");
    }
    const { error } = await supabase.auth.updateUser({
      password: parsed.password,
      ...(parsed.currentPassword ? { currentPassword: parsed.currentPassword } : {}),
    });
    if (error) {
      logger.warn("account_password_update_failed");
      throw new ValidationError("Could not update the password. If you already have one, enter the current password correctly.");
    }
    await writeAuditLog({
      actorUserId: user.id,
      organizationId: membership.organizationId,
      action: "ACCOUNT_PASSWORD_UPDATED",
      entityType: "User",
      entityId: user.id,
    });
    try {
      await sendPasswordChangedEmail({
        to: user.email,
        recipientName: membership.user.name ?? "",
        idempotencyKey: `password-changed:${user.id}:${Date.now()}`,
      });
    } catch {
      logger.warn("password_changed_email_failed");
    }
    return NextResponse.json({ ok: true });
  }, request);
}
