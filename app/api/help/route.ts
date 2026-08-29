import { connection, NextResponse } from "next/server";

import { envString, linuxEnvironSize, resendKeyProbe } from "@/lib/email/env";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { handleRoute } from "@/lib/http/route";
import { clientIp } from "@/lib/http/ip";
import { helpFromAddress } from "@/lib/help/from";
import { parseHelpContact } from "@/lib/help/input";
import { submitHelpRequest } from "@/lib/help/service";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleRoute(async () => {
    await connection();
    await requireRateLimit("api-read", clientIp(request));
    const from = helpFromAddress();
    const probe = resendKeyProbe();
    return NextResponse.json({
      ok: true,
      keyPresent: probe.keyPresent,
      fromPresent: from.includes("@"),
      resendNames: probe.names,
      namedChars: probe.namedChars,
      startsWithRe: probe.startsWithRe,
      linuxEnvKeys: linuxEnvironSize(),
      commit: envString("VERCEL_GIT_COMMIT_SHA").slice(0, 7) || null,
    });
  }, request);
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    await connection();
    await requireRateLimit("help-contact-ip", clientIp(request));
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const parsed = parseHelpContact(body);
    await requireRateLimit("help-contact-email", parsed.email);
    const session = await getSessionOrNull();
    let userId: string | undefined;
    let organizationId: string | undefined;
    if (session) {
      userId = session.id;
      try {
        const membership = await requireOrganization(session);
        organizationId = membership.organizationId;
      } catch {
        organizationId = undefined;
      }
    }
    const result = await submitHelpRequest({
      ...parsed,
      email: session?.email.toLowerCase() ?? parsed.email,
      userId,
      organizationId,
    });
    return NextResponse.json({ ok: true, id: result.id });
  }, request);
}
