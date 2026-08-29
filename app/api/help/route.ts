import { connection, NextResponse } from "next/server";

import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { handleRoute } from "@/lib/http/route";
import { clientIp } from "@/lib/http/ip";
import { parseHelpContact } from "@/lib/help/input";
import { submitHelpRequest } from "@/lib/help/service";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    await connection();
    void process.env.RESEND_API_KEY;
    void process.env.EMAIL_FROM;
    void process.env.EMAIL_FROM_HELP;
    void process.env.HELP_INBOX;
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
