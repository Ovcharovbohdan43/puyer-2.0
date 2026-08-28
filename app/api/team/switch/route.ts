import { NextResponse } from "next/server";

import { requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { switchActiveOrganization } from "@/lib/team/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireOrganization(user);
    await requireRateLimit("team-write", user.id);
    let body: { organizationId?: unknown } = {};
    try {
      body = (await request.json()) as { organizationId?: unknown };
    } catch {
      body = {};
    }
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";
    if (!organizationId) {
      throw new ValidationError("Choose a workspace.");
    }
    await switchActiveOrganization(user.id, organizationId);
    return NextResponse.json({ ok: true });
  }, request);
}
