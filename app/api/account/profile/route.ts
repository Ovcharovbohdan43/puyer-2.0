import { NextResponse } from "next/server";

import { parseAccountProfileBody } from "@/lib/account/input";
import { updateAccountProfile } from "@/lib/account/service";
import { requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("account-write", user.id);
    const membership = await requireOrganization(user);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const parsed = parseAccountProfileBody(body, membership.role === "OWNER");
    await updateAccountProfile(user, parsed);
    return NextResponse.json({ ok: true });
  }, request);
}
