import { NextResponse } from "next/server";

import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { sendManualReminder } from "@/lib/reminders/send";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("invoice-send", user.id);
    const { id } = await context.params;
    let body: { message?: unknown };
    try {
      body = (await request.json()) as { message?: unknown };
    } catch {
      body = {};
    }
    const message = typeof body.message === "string" ? body.message : "";
    await sendManualReminder(user, id, message);
    return NextResponse.json({ ok: true });
  }, request);
}
