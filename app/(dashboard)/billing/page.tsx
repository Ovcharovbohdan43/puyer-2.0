import { BillingSettings } from "@/components/dashboard/billing-settings";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { planFromOrganization } from "@/lib/entitlements/load";
import { messages, t } from "@/lib/i18n";
import { logger } from "@/lib/observability/logger";

type BillingCopy = (typeof messages)["billing"];

export default async function BillingPage() {
  const session = await requireSession();
  const copy = t("billing");
  const dash = t("dashboard");
  try {
    const membership = await requireOrganization(session);
    const subscription = membership.organization.subscription;
    const plan = planFromOrganization(membership.organization);
    const planLabel =
      plan === "BUSINESS" ? dash.businessPlan : plan === "PRO" ? dash.proPlan : dash.freePlan;
    const statusLabel = statusCopy(
      membership.organization.planSource === "MANUAL"
        ? membership.organization.subscriptionStatus
        : (subscription?.status ?? null),
      copy,
    );
    const periodEndLabel = subscription?.currentPeriodEnd
      ? copy.renewsOn.replace("{date}", subscription.currentPeriodEnd.toISOString().slice(0, 10))
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
  } catch {
    logger.warn("billing_unavailable");
    return (
      <BillingSettings
        isOwner={false}
        planLabel={dash.freePlan}
        statusLabel={statusCopy(null, copy)}
        periodEndLabel={null}
        cancelAtPeriodEnd={false}
        hasCustomer={false}
        canCheckout={false}
      />
    );
  }
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
