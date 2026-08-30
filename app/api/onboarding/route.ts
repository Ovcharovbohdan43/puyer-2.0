import { NextResponse } from "next/server";

import { completeOnboarding } from "@/lib/onboarding/service";
import { parseOnboardingBody } from "@/lib/onboarding/input";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("onboarding-write", user.id);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const parsed = parseOnboardingBody(body);
    await completeOnboarding(user, parsed);
    return NextResponse.json({ ok: true });
  }, request);
}
