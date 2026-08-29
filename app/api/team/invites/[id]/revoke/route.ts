import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { planFromOrganization } from "@/lib/entitlements/load";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { revokeInvite } from "@/lib/team/service";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    await requireRateLimit("team-write", membership.organizationId);
    const { id } = await context.params;
    await revokeInvite({
      organizationId: membership.organizationId,
      actorRole: membership.role,
      plan: planFromOrganization(membership.organization),
      inviteId: id,
    });
    return NextResponse.json({ ok: true });
  }, request);
}
