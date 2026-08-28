import type Stripe from "stripe";

import { isPlatformInvoicePaymentEvent } from "@/lib/stripe/webhooks/domain";

export type PlatformProcessResult = {
  status: "PROCESSED" | "IGNORED";
  markedInvoicePaid: false;
};

export function processPlatformEvent(event: Stripe.Event): PlatformProcessResult {
  if (event.account) {
    return { status: "IGNORED", markedInvoicePaid: false };
  }
  if (isPlatformInvoicePaymentEvent(event.type)) {
    return { status: "IGNORED", markedInvoicePaid: false };
  }
  if (
    event.type.startsWith("customer.subscription.") ||
    event.type === "checkout.session.completed" ||
    event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed"
  ) {
    return { status: "PROCESSED", markedInvoicePaid: false };
  }
  return { status: "IGNORED", markedInvoicePaid: false };
}
