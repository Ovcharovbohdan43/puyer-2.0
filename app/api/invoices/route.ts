import { NextResponse } from "next/server";

import { createInvoiceFromBuilder, serializeInvoice } from "@/lib/invoices/persist";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import type { BuilderState } from "@/components/invoice-builder/types";

function asBuilderState(body: unknown): BuilderState {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Check the form and try again.");
  }
  return body as BuilderState;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("invoice-write", user.id);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Check the form and try again.");
    }
    const invoice = await createInvoiceFromBuilder(user, asBuilderState(body));
    return NextResponse.json({ ok: true, invoice: serializeInvoice(invoice) }, { status: 201 });
  }, request);
}
