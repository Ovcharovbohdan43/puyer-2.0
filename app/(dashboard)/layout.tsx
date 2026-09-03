import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import type { Plan } from "@prisma/client";

import { PuyerRouteLoading } from "@/components/brand/puyer-spinner";
import { AppShell } from "@/components/dashboard/app-shell";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { planFromOrganization } from "@/lib/entitlements/load";
import { findActiveBanForUser } from "@/lib/moderation/bans";
import { needsOnboarding } from "@/lib/onboarding/input";
import { t } from "@/lib/i18n";

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PuyerRouteLoading />}>
      <DashboardAuthShell>{children}</DashboardAuthShell>
    </Suspense>
  );
}

async function DashboardAuthShell({ children }: { children: ReactNode }) {
  const session = await getSessionOrNull();
  if (!session) {
    redirect("/login");
  }

  const copy = t("dashboard");
  const [ban, membership] = await Promise.all([
    findActiveBanForUser(session.id),
    requireOrganization(session).catch(() => null),
  ]);
  if (ban) {
    redirect("/banned");
  }
  if (membership && needsOnboarding(membership.user.onboardingCompletedAt)) {
    redirect("/onboarding");
  }

  let displayName = session.email;
  let plan: Plan = "FREE";
  if (membership) {
    displayName = membership.user.name?.trim() || session.email;
    plan = planFromOrganization(membership.organization);
  } else {
    displayName = copy.fallbackName;
  }

  return (
    <AppShell displayName={displayName} plan={plan}>
      {children}
    </AppShell>
  );
}
