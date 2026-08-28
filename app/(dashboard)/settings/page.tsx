import { redirect } from "next/navigation";

import { StripeSettings } from "@/components/dashboard/stripe-settings";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { can } from "@/lib/entitlements";
import { planFromRow } from "@/lib/entitlements/load";
import { logger } from "@/lib/observability/logger";
import { loadConnectionForSettings, refreshConnectionStatus } from "@/lib/stripe/connect/service";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const session = await getSessionOrNull();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  let membership;
  try {
    membership = await requireOrganization(session);
  } catch {
    logger.warn("settings_workspace_unavailable");
    return (
      <StripeSettings isOwner={false} status="NOT_CONNECTED" chargesEnabled={false} canConnect={false} />
    );
  }

  if (params.stripe === "return" || params.stripe === "refresh") {
    try {
      await refreshConnectionStatus(membership.organizationId);
    } catch {
      logger.warn("settings_stripe_refresh_failed");
    }
    redirect("/settings");
  }

  const connection = await loadConnectionForSettings(membership.organizationId);
  return (
    <StripeSettings
      isOwner={membership.role === "OWNER"}
      status={connection.status}
      chargesEnabled={connection.chargesEnabled}
      canConnect={can({ plan: planFromRow(membership.organization.subscription) }, "STRIPE_PAYMENTS")}
    />
  );
}
