import { NextResponse } from "next/server";

import { requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { getNotificationPreference, updateNotificationPreference } from "@/lib/notifications";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("api-read", user.id);
    const membership = await requireOrganization(user);
    const pref = await getNotificationPreference(user.id, membership.organizationId);
    return NextResponse.json({
      ok: true,
      emailEnabled: pref.emailEnabled,
      inAppEnabled: pref.inAppEnabled,
    });
  }, request);
}

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("notifications-write", user.id);
    const membership = await requireOrganization(user);
    let body: { emailEnabled?: unknown; inAppEnabled?: unknown } = {};
    try {
      body = (await request.json()) as { emailEnabled?: unknown; inAppEnabled?: unknown };
    } catch {
      throw new ValidationError("Check the form and try again.");
    }
    const data: { emailEnabled?: boolean; inAppEnabled?: boolean } = {};
    if (typeof body.emailEnabled === "boolean") {
      data.emailEnabled = body.emailEnabled;
    }
    if (typeof body.inAppEnabled === "boolean") {
      data.inAppEnabled = body.inAppEnabled;
    }
    const pref = await updateNotificationPreference(user.id, membership.organizationId, data);
    return NextResponse.json({
      ok: true,
      emailEnabled: pref.emailEnabled,
      inAppEnabled: pref.inAppEnabled,
    });
  }, request);
}
