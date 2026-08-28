import { NextResponse } from "next/server";

import { loadEffectivePlan } from "@/lib/entitlements/load";
import { NotFoundError, toPublicError } from "@/lib/errors";
import { clientIp } from "@/lib/http/ip";
import { invoiceToBuilderState } from "@/lib/invoices/builder-state";
import { getPublicInvoice } from "@/lib/invoices/persist";
import { isInvoicePublicId } from "@/lib/invoices/public-id";
import { parsePaperSize } from "@/lib/pdf/paper";
import { invoicePdfResponsePayload } from "@/lib/pdf/serve";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { publicInvoiceLimitKey } from "@/lib/rate-limit/public-invoice";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await context.params;
    if (!isInvoicePublicId(publicId)) {
      throw new NotFoundError();
    }
    const ip = clientIp(request);
    await requireRateLimit("pdf-public", publicInvoiceLimitKey(ip, publicId));
    const invoice = await getPublicInvoice(publicId);
    const plan = await loadEffectivePlan(invoice.organizationId);
    const paper = parsePaperSize(new URL(request.url).searchParams.get("paper"));
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
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const publicError = toPublicError(error);
    return NextResponse.json({ ok: false, error: publicError.message }, { status: publicError.status });
  }
}
