import { NextResponse } from "next/server";

import { requireOrgRole, requireOrganization } from "@/lib/authorization";
import { prisma } from "@/lib/db/prisma";
import { requireEntitlement } from "@/lib/entitlements";
import { loadEffectivePlan } from "@/lib/entitlements/load";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { isConnectCountry, parseConnectCountry } from "@/lib/regions/countries";
import { createConnectedAccount, createOnboardingLink } from "@/lib/stripe/connect/service";

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

    const stored = membership.organization.businessProfile?.defaultCountry || "US";
    let country = parseConnectCountry(stored);
    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object" && "country" in body && isConnectCountry(body.country)) {
        country = parseConnectCountry(body.country);
      }
    } catch {
      country = parseConnectCountry(stored);
    }

    await prisma.businessProfile.update({
      where: { organizationId: membership.organizationId },
      data: { defaultCountry: country },
    });

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
