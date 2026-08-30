import { NextResponse } from "next/server";

import { serializeInvoice, updateInvoiceFromBuilder, deleteInvoice } from "@/lib/invoices/persist";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import type { BuilderState } from "@/components/invoice-builder/types";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("invoice-write", user.id);
    const { id } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Check the form and try again.");
    }
    const invoice = await updateInvoiceFromBuilder(user, id, body as BuilderState);
    return NextResponse.json({ ok: true, invoice: serializeInvoice(invoice) });
  }, request);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("invoice-write", user.id);
    const { id } = await context.params;
    await deleteInvoice(user, id);
    return NextResponse.json({ ok: true });
  }, request);
}
