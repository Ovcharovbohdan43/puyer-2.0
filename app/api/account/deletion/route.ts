import { NextResponse } from "next/server";

import { parseDeletionReason } from "@/lib/account/input";
import { cancelDeletionRequest, createDeletionRequest } from "@/lib/account/service";
import { prisma } from "@/lib/db/prisma";
import { sendAccountDeletionEmails } from "@/lib/email";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { logger } from "@/lib/observability/logger";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("account-write", user.id);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    if (record.action === "cancel") {
      await cancelDeletionRequest(user);
      return NextResponse.json({ ok: true, canceled: true });
    }
    const reason = parseDeletionReason(body);
    const { request: deletion, membership } = await createDeletionRequest(user, reason);
    try {
      await sendAccountDeletionEmails({
        requestId: deletion.id,
        email: user.email,
        name: membership.user.name?.trim() || user.email,
        reason,
        organizationName: membership.organization.name,
      });
      await prisma.accountDeletionRequest.update({
        where: { id: deletion.id },
        data: { notifiedAt: new Date() },
      });
    } catch {
      logger.warn("account_deletion_email_failed");
    }
    return NextResponse.json({ ok: true, requestId: deletion.id });
  }, request);
}
