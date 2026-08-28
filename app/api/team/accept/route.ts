import { NextResponse } from "next/server";

import { handleRoute, requireApiSession } from "@/lib/http/route";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { acceptInvite } from "@/lib/team/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("team-write", user.id);
    let body: { token?: unknown } = {};
    try {
      body = (await request.json()) as { token?: unknown };
    } catch {
      body = {};
    }
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      throw new ValidationError("This invitation is no longer valid.");
    }
    const result = await acceptInvite({ token, userId: user.id, email: user.email });
    return NextResponse.json({ ok: true, ...result });
  }, request);
}
