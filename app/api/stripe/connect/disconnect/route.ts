import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { disconnectAccount } from "@/lib/stripe/connect/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    await requireRateLimit("stripe-disconnect", membership.organizationId);
    const result = await disconnectAccount({
      organizationId: membership.organizationId,
      actorUserId: user.id,
    });
    return NextResponse.json({ ok: true, status: result.status });
  }, request);
}
