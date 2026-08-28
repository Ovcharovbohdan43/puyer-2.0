import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { createCustomerPortalSession } from "@/lib/stripe/platform/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    await requireRateLimit("platform-portal", membership.organizationId);
    const session = await createCustomerPortalSession(membership.organizationId);
    return NextResponse.json({ ok: true, url: session.url });
  }, request);
}
