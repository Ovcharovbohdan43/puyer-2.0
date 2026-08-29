import { NextResponse } from "next/server";
import type { InvoiceStatus } from "@prisma/client";

import { handleRoute, requireApiSession } from "@/lib/http/route";
import { serializeInvoice, setInvoiceStatus } from "@/lib/invoices/persist";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";

const STATUSES: ReadonlySet<InvoiceStatus> = new Set([
  "DRAFT",
  "READY",
  "SENT",
  "VIEWED",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELED",
]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("invoice-write", user.id);
    const { id } = await context.params;
    let body: { status?: unknown };
    try {
      body = (await request.json()) as { status?: unknown };
    } catch {
      throw new ValidationError("This status change is not allowed.");
    }
    const status = typeof body.status === "string" ? body.status : "";
    if (!STATUSES.has(status as InvoiceStatus)) {
      throw new ValidationError("This status change is not allowed.");
    }
    const invoice = await setInvoiceStatus(user, id, status as InvoiceStatus);
    return NextResponse.json({ ok: true, invoice: serializeInvoice(invoice) });
  }, request);
}
