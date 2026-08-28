import { notFound } from "next/navigation";

import { PublicInvoiceScreen } from "@/components/invoice/public-invoice-screen";
import { getPublicInvoice } from "@/lib/invoices/persist";
import { totalsForInvoice } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";
import { isInvoicePublicId } from "@/lib/invoices/public-id";
import { publicPayBadge } from "@/lib/invoices/status";
import { getPublicPaymentOffer } from "@/lib/payments/public-offer";
import { publicBuilderState, toPublicInvoiceView } from "@/lib/pdf/public-view";

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { publicId } = await params;
  const query = await searchParams;
  if (!isInvoicePublicId(publicId)) {
    notFound();
  }

  let invoice;
  try {
    invoice = await getPublicInvoice(publicId);
  } catch {
    notFound();
  }

  const view = toPublicInvoiceView(invoice);
  const state = publicBuilderState(view);
  const currency = getCurrency(state.currency);
  const totals = totalsForInvoice(
    state.items,
    currency.exponent,
    state.discountType,
    state.discountValue,
    state.taxRate,
  );
  const offer = await getPublicPaymentOffer(invoice);
  return (
    <PublicInvoiceScreen
      publicId={view.publicId}
      state={state}
      currency={currency}
      totals={totals}
      badge={publicPayBadge(invoice.status, invoice.dueDate)}
      payable={offer.payable}
      connected={offer.connected}
      paid={offer.paid}
      checkout={query.checkout}
    />
  );
}
