import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { requireEntitlement } from "@/lib/entitlements";
import { loadEffectivePlan } from "@/lib/entitlements/load";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { createConnectedAccount, createOnboardingLink } from "@/lib/stripe/connect/service";
import { isIsoCountry } from "@/lib/stripe/webhooks/hash";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireOrgRole(user, membership.organizationId, ["OWNER"]);
    requireEntitlement(
      { plan: await loadEffectivePlan(membership.organizationId) },
      "STRIPE_PAYMENTS",
    );
    await requireRateLimit("stripe-onboard", membership.organizationId);

    let country = "US";
    try {
      const body: unknown = await request.json();
      if (
        body &&
        typeof body === "object" &&
        "country" in body &&
        typeof body.country === "string" &&
        isIsoCountry(body.country)
      ) {
        country = body.country.toUpperCase();
      }
    } catch {
      country = "US";
    }

    await createConnectedAccount({
      organizationId: membership.organizationId,
      email: user.email,
      displayName: membership.organization.businessProfile?.businessName || membership.organization.name,
      currency: membership.organization.businessProfile?.defaultCurrency || "USD",
      country,
      actorUserId: user.id,
    });
    const url = await createOnboardingLink(membership.organizationId);
    return NextResponse.json({ ok: true, url });
  }, request);
}
