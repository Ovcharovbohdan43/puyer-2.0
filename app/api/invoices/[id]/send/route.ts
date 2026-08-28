import { NextResponse } from "next/server";

import { markInvoiceSent, serializeInvoice } from "@/lib/invoices/persist";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("invoice-send", user.id);
    const { id } = await context.params;
    const invoice = await markInvoiceSent(user, id);
    return NextResponse.json({ ok: true, invoice: serializeInvoice(invoice) });
  }, request);
}
