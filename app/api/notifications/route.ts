import { NextResponse } from "next/server";

import { requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { listUserNotifications } from "@/lib/notifications";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("api-read", user.id);
    const membership = await requireOrganization(user);
    const items = await listUserNotifications(user.id, membership.organizationId);
    return NextResponse.json({
      ok: true,
      notifications: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        readAt: item.readAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  }, request);
}
