import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/entitlements";
import { loadEffectivePlan } from "@/lib/entitlements/load";
import { NotFoundError, StripeConnectionError, ValidationError, toPublicError } from "@/lib/errors";
import { clientIp } from "@/lib/http/ip";
import { isPayableStatus } from "@/lib/invoices/payable";
import { getPublicInvoice } from "@/lib/invoices/persist";
import { isInvoicePublicId } from "@/lib/invoices/public-id";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { publicInvoiceLimitKey } from "@/lib/rate-limit/public-invoice";
import { appBaseUrl } from "@/lib/stripe/client";
import { createInvoiceCheckout } from "@/lib/stripe/connect/service";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await context.params;
    if (!isInvoicePublicId(publicId)) {
      throw new NotFoundError();
    }
    const ip = clientIp(request);
    await requireRateLimit("pay-public", publicInvoiceLimitKey(ip, publicId));

    const invoice = await getPublicInvoice(publicId);
    if (!isPayableStatus(invoice.status) || invoice.totalMinor <= 0n) {
      throw new ValidationError("This invoice cannot be paid online.");
    }

    const plan = await loadEffectivePlan(invoice.organizationId);
    if (!can({ plan }, "STRIPE_PAYMENTS")) {
      throw new StripeConnectionError("Online payment is currently unavailable.");
    }

    const connection = await prisma.stripeConnection.findUnique({
      where: { organizationId: invoice.organizationId },
    });
    if (!connection || connection.status !== "CONNECTED" || !connection.chargesEnabled) {
      throw new StripeConnectionError("Online payment is currently unavailable.");
    }

    const base = appBaseUrl();
    const session = await createInvoiceCheckout({
      connectedAccountId: connection.stripeConnectedAccountId,
      invoiceId: invoice.id,
      publicId: invoice.publicId,
      invoiceNumber: invoice.invoiceNumber,
      currency: invoice.currency,
      totalMinor: invoice.totalMinor,
      successUrl: `${base}/invoice/${encodeURIComponent(invoice.publicId)}?checkout=success`,
      cancelUrl: `${base}/invoice/${encodeURIComponent(invoice.publicId)}?checkout=cancel`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    const publicError = toPublicError(error);
    return NextResponse.json({ ok: false, error: publicError.message }, { status: publicError.status });
  }
}
