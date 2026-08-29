import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { planFromOrganization } from "@/lib/entitlements/load";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { inviteMember } from "@/lib/team/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    await requireRateLimit("team-invite", membership.organizationId);
    let body: { email?: unknown } = {};
    try {
      body = (await request.json()) as { email?: unknown };
    } catch {
      body = {};
    }
    const email = typeof body.email === "string" ? body.email : "";
    const plan = planFromOrganization(membership.organization);
    const result = await inviteMember({
      organizationId: membership.organizationId,
      actorUserId: user.id,
      actorRole: membership.role,
      plan,
      email,
      orgName: membership.organization.name,
    });
    return NextResponse.json({ ok: true, ...result });
  }, request);
}
