import { BillingSettings } from "@/components/dashboard/billing-settings";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { planFromRow } from "@/lib/entitlements/load";
import { messages, t } from "@/lib/i18n";

type BillingCopy = (typeof messages)["billing"];

export default async function BillingPage() {
  const session = await requireSession();
  const membership = await requireOrganization(session);
  const copy = t("billing");
  const dash = t("dashboard");
  const subscription = membership.organization.subscription;
  const plan = planFromRow(subscription);
  const planLabel =
    plan === "BUSINESS" ? dash.businessPlan : plan === "PRO" ? dash.proPlan : dash.freePlan;
  const statusLabel = statusCopy(subscription?.status ?? null, copy);
  const periodEndLabel = subscription?.currentPeriodEnd
    ? copy.renewsOn.replace("{date}", subscription.currentPeriodEnd.toLocaleDateString("en-US"))
    : null;

  return (
    <BillingSettings
      isOwner={membership.role === "OWNER"}
      planLabel={planLabel}
      statusLabel={statusLabel}
      periodEndLabel={periodEndLabel}
      cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
      hasCustomer={Boolean(subscription?.stripeCustomerId)}
      canCheckout={plan === "FREE"}
    />
  );
}

function statusCopy(status: string | null, copy: BillingCopy): string {
  switch (status) {
    case "ACTIVE":
      return copy.statusActive;
    case "TRIALING":
      return copy.statusTrialing;
    case "PAST_DUE":
      return copy.statusPastDue;
    case "CANCELED":
      return copy.statusCanceled;
    case "UNPAID":
      return copy.statusUnpaid;
    case "INCOMPLETE":
    case "INCOMPLETE_EXPIRED":
      return copy.statusIncomplete;
    default:
      return copy.statusNone;
  }
}
