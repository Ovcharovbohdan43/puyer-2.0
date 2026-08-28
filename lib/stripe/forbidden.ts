const FORBIDDEN = [
  "application_fee_amount",
  "application_fee",
  "transfer_data",
  "destination",
  "on_behalf_of",
  "stripe_transfers",
] as const;

export function payloadContainsForbiddenMoneyFields(payload: unknown): boolean {
  const json = JSON.stringify(payload);
  return FORBIDDEN.some((field) => json.includes(`"${field}"`) || json.includes(`${field}:`));
}

export function assertSafeDirectChargePayload(params: unknown, requestOptions: { stripeAccount?: string }): void {
  if (!requestOptions.stripeAccount) {
    throw new Error("Direct charge Checkout requires stripeAccount.");
  }
  if (payloadContainsForbiddenMoneyFields(params) || payloadContainsForbiddenMoneyFields(requestOptions)) {
    throw new Error("Forbidden Connect money field.");
  }
}

export function assertMerchantOnlyAccountCreate(payload: unknown): void {
  const json = JSON.stringify(payload);
  if (json.includes('"recipient"') || json.includes("stripe_transfers")) {
    throw new Error("Connected accounts must not enable recipient or transfers.");
  }
  if (!json.includes('"fees_collector":"stripe"') || !json.includes('"losses_collector":"stripe"')) {
    throw new Error("Connected accounts must set fees_collector and losses_collector to stripe.");
  }
  if (!json.includes('"dashboard":"full"')) {
    throw new Error("Connected accounts must use a full Stripe Dashboard.");
  }
}

export function assertNoStripeAccountHeader(requestOptions: object): void {
  if ("stripeAccount" in requestOptions && Boolean((requestOptions as { stripeAccount?: unknown }).stripeAccount)) {
    throw new Error("Platform Stripe requests must not set stripeAccount.");
  }
}
