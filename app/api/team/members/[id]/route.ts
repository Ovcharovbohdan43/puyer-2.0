import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { ValidationError } from "@/lib/errors";
import { planFromOrganization } from "@/lib/entitlements/load";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { removeMember, updateMemberRole } from "@/lib/team/service";
import type { OrgRole } from "@prisma/client";

export const runtime = "nodejs";

function parseRole(value: unknown): OrgRole {
  if (value === "OWNER" || value === "MEMBER") {
    return value;
  }
  throw new ValidationError("Choose a role.");
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    await requireRateLimit("team-write", membership.organizationId);
    const { id } = await context.params;
    let body: { role?: unknown } = {};
    try {
      body = (await request.json()) as { role?: unknown };
    } catch {
      body = {};
    }
    await updateMemberRole({
      organizationId: membership.organizationId,
      actorUserId: user.id,
      actorRole: membership.role,
      plan: planFromOrganization(membership.organization),
      memberId: id,
      nextRole: parseRole(body.role),
    });
    return NextResponse.json({ ok: true });
  }, request);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    await requireRateLimit("team-write", membership.organizationId);
    const { id } = await context.params;
    await removeMember({
      organizationId: membership.organizationId,
      actorUserId: user.id,
      actorRole: membership.role,
      plan: planFromOrganization(membership.organization),
      memberId: id,
    });
    return NextResponse.json({ ok: true });
  }, request);
}
