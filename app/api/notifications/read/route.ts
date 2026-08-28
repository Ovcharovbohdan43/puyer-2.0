import { NextResponse } from "next/server";

import { requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireRateLimit("notifications-write", user.id);
    let body: { id?: unknown; all?: unknown } = {};
    try {
      body = (await request.json()) as { id?: unknown; all?: unknown };
    } catch {
      body = {};
    }
    if (body.all === true) {
      await markAllNotificationsRead(user.id, membership.organizationId);
      return NextResponse.json({ ok: true });
    }
    if (typeof body.id !== "string") {
      throw new ValidationError("Choose a notification.");
    }
    await markNotificationRead(user.id, membership.organizationId, body.id);
    return NextResponse.json({ ok: true });
  }, request);
}
