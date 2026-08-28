import type { StripeConnectionStatus } from "@prisma/client";
import type Stripe from "stripe";

export type ConnectionSnapshot = {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: boolean;
  status: StripeConnectionStatus;
};

export function mapV2AccountToConnection(account: Stripe.V2.Core.Account): ConnectionSnapshot {
  const cardStatus = account.configuration?.merchant?.capabilities?.card_payments?.status;
  const chargesEnabled = cardStatus === "active";
  const dueEntries = (account.requirements?.entries ?? []).filter(
    (entry) => entry.awaiting_action_from === "user",
  );
  const currentlyDue =
    dueEntries.length > 0 || account.requirements?.summary?.minimum_deadline?.status === "currently_due";
  const detailsSubmitted = Boolean(account.identity) && dueEntries.length === 0;
  return finalizeSnapshot({
    chargesEnabled,
    payoutsEnabled: chargesEnabled,
    detailsSubmitted,
    currentlyDue,
  });
}

export function mapV1AccountToConnection(account: Stripe.Account): ConnectionSnapshot {
  return finalizeSnapshot({
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    currentlyDue: (account.requirements?.currently_due?.length ?? 0) > 0,
  });
}

function finalizeSnapshot(input: {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  currentlyDue: boolean;
}): ConnectionSnapshot {
  let status: StripeConnectionStatus = "CONNECTING";
  if (input.chargesEnabled) {
    status = input.currentlyDue ? "ACTION_REQUIRED" : "CONNECTED";
  } else if (input.currentlyDue || input.detailsSubmitted) {
    status = "ACTION_REQUIRED";
  }
  return { ...input, status };
}
