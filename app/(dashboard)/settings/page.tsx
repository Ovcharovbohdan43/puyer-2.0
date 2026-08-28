import { redirect } from "next/navigation";

import { StripeSettings } from "@/components/dashboard/stripe-settings";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { prisma } from "@/lib/db/prisma";
import { can } from "@/lib/entitlements";
import { planFromRow } from "@/lib/entitlements/load";
import { refreshConnectionStatus } from "@/lib/stripe/connect/service";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const session = await requireSession();
  const membership = await requireOrganization(session);
  const params = await searchParams;
  if (params.stripe === "return" || params.stripe === "refresh") {
    try {
      await refreshConnectionStatus(membership.organizationId);
    } catch {
      redirect("/settings");
    }
    redirect("/settings");
  }

  const connection = await prisma.stripeConnection.findUnique({
    where: { organizationId: membership.organizationId },
  });

  return (
    <StripeSettings
      isOwner={membership.role === "OWNER"}
      status={connection?.status ?? "NOT_CONNECTED"}
      chargesEnabled={connection?.chargesEnabled ?? false}
      canConnect={can({ plan: planFromRow(membership.organization.subscription) }, "STRIPE_PAYMENTS")}
    />
  );
}
