import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Plan } from "@prisma/client";

import { AppShell } from "@/components/dashboard/app-shell";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { planFromOrganization } from "@/lib/entitlements/load";
import { findActiveBanForUser } from "@/lib/moderation/bans";
import { needsOnboarding } from "@/lib/onboarding/input";
import { t } from "@/lib/i18n";

export default async function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSessionOrNull();
  if (!session) {
    redirect("/login");
  }
  if (await findActiveBanForUser(session.id)) {
    redirect("/banned");
  }

  const copy = t("dashboard");
  let displayName = session.email;
  let plan: Plan = "FREE";
  let membership = null;
  try {
    membership = await requireOrganization(session);
  } catch {
    membership = null;
  }
  if (membership && needsOnboarding(membership.user.onboardingCompletedAt)) {
    redirect("/onboarding");
  }
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
