import { redirect } from "next/navigation";

import { AccountSettingsScreen } from "@/components/dashboard/account-settings-screen";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { loadOpenDeletionRequest } from "@/lib/account/service";
import { can } from "@/lib/entitlements";
import { planFromOrganization } from "@/lib/entitlements/load";
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
      <AccountSettingsScreen
        email={session.email}
        name=""
        timezone="UTC"
        isOwner={false}
        businessName=""
        businessAddress=""
        country="US"
        deletionOpen={false}
        deletionCreatedAt={null}
        stripe={{
          isOwner: false,
          status: "NOT_CONNECTED",
          chargesEnabled: false,
          canConnect: false,
          country: "US",
          identityCountry: null,
        }}
      />
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

  const [connection, deletion] = await Promise.all([
    loadConnectionForSettings(membership.organizationId),
    loadOpenDeletionRequest(session.id),
  ]);
  let canConnect = false;
  try {
    canConnect = can({ plan: planFromOrganization(membership.organization) }, "STRIPE_PAYMENTS");
  } catch {
    logger.warn("settings_plan_unavailable");
  }

  const profile = membership.organization.businessProfile;

  return (
    <AccountSettingsScreen
      email={membership.user.email || session.email}
      name={membership.user.name ?? ""}
      timezone={membership.user.timezone || "UTC"}
      isOwner={membership.role === "OWNER"}
      businessName={profile?.businessName ?? ""}
      businessAddress={profile?.businessAddress ?? ""}
      country={profile?.defaultCountry ?? "US"}
      deletionOpen={Boolean(deletion)}
      deletionCreatedAt={deletion?.createdAt.toISOString().slice(0, 10) ?? null}
      stripe={{
        isOwner: membership.role === "OWNER",
        status: connection.status,
        chargesEnabled: connection.chargesEnabled,
        canConnect,
        country: profile?.defaultCountry ?? "US",
        identityCountry: connection.identityCountry,
      }}
    />
  );
}
