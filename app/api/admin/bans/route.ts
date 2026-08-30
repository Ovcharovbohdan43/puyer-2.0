import { NextResponse } from "next/server";

import { handleRoute } from "@/lib/http/route";
import { clientIp } from "@/lib/http/ip";
import { applyAccountBan, assertPlatformAdmin, liftAccountBan } from "@/lib/moderation/bans";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    assertPlatformAdmin(request);
    await requireRateLimit("platform-admin", clientIp(request));
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      throw new ValidationError("Send JSON with the ban fields.");
    }
    const action = typeof body.action === "string" ? body.action : "ban";
    if (action === "lift") {
      const banId = typeof body.banId === "string" ? body.banId : "";
      const ban = await liftAccountBan(banId);
      return NextResponse.json({ ok: true, ban });
    }
    const targetType = body.targetType === "ORGANIZATION" ? "ORGANIZATION" : body.targetType === "USER" ? "USER" : null;
    if (!targetType) {
      throw new ValidationError("targetType must be USER or ORGANIZATION.");
    }
    const kind = body.kind === "TEMPORARY" ? "TEMPORARY" : body.kind === "PERMANENT" ? "PERMANENT" : null;
    if (!kind) {
      throw new ValidationError("kind must be TEMPORARY or PERMANENT.");
    }
    const ban = await applyAccountBan({
      targetType,
      kind,
      reason: typeof body.reason === "string" ? body.reason : "",
      userId: typeof body.userId === "string" ? body.userId : undefined,
      organizationId: typeof body.organizationId === "string" ? body.organizationId : undefined,
      endsAt: parseDate(body.endsAt),
    });
    return NextResponse.json({ ok: true, ban }, { status: 201 });
  }, request);
}
