import { NextResponse } from "next/server";

import { requireInvoiceAccess } from "@/lib/authorization/invoice";
import { loadEffectivePlan } from "@/lib/entitlements/load";
import { toPublicError } from "@/lib/errors";
import { clientIp } from "@/lib/http/ip";
import { requireApiSession } from "@/lib/http/route";
import { invoiceToBuilderState } from "@/lib/invoices/builder-state";
import { parsePaperSize } from "@/lib/pdf/paper";
import { invoicePdfResponsePayload } from "@/lib/pdf/serve";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = clientIp(request);
    await requireRateLimit("pdf-auth", ip);
    const user = await requireApiSession();
    const { id } = await context.params;
    const { membership, invoice } = await requireInvoiceAccess(user, id);
    const paper = parsePaperSize(new URL(request.url).searchParams.get("paper"));
    const plan = await loadEffectivePlan(membership.organizationId);
    const { buffer, filename } = await invoicePdfResponsePayload(
      invoice.id,
      invoice.invoiceNumber,
      invoiceToBuilderState(invoice),
      paper,
      plan,
    );
    return new Response(Uint8Array.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const publicError = toPublicError(error);
    return NextResponse.json({ ok: false, error: publicError.message }, { status: publicError.status });
  }
}
