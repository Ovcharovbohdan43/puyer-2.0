import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { parseBillingInterval, parseBillingPlan, priceIdFor } from "@/lib/stripe/platform/prices";
import { createSubscriptionCheckout } from "@/lib/stripe/platform/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    await requireRateLimit("platform-checkout", membership.organizationId);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const plan = parseBillingPlan(
      body && typeof body === "object" && "plan" in body ? body.plan : undefined,
    );
    const interval = parseBillingInterval(
      body && typeof body === "object" && "interval" in body ? body.interval : undefined,
    );
    const priceId = priceIdFor(plan, interval);
    const session = await createSubscriptionCheckout({
      organizationId: membership.organizationId,
      email: user.email,
      name: membership.user.name || membership.organization.name,
      priceId,
    });
    return NextResponse.json({ ok: true, url: session.url });
  }, request);
}
