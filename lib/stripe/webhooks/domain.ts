export function isTerminalWebhookStatus(status: "RECEIVED" | "PROCESSED" | "FAILED" | "IGNORED"): boolean {
  return status === "PROCESSED" || status === "IGNORED";
}

export function stripeWebhookDomain(event: { account?: string | null }): "CONNECT" | "PLATFORM" {
  return event.account ? "CONNECT" : "PLATFORM";
}

export function isConnectSubscriptionEvent(type: string): boolean {
  return type.startsWith("customer.subscription.");
}

export function isPlatformInvoicePaymentEvent(type: string): boolean {
  return (
    type === "payment_intent.succeeded" ||
    type === "payment_intent.payment_failed" ||
    type === "charge.refunded" ||
    type === "charge.dispute.created"
  );
}
