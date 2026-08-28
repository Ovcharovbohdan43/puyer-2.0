import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Plan } from "@prisma/client";

import { AppShell } from "@/components/dashboard/app-shell";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { planFromRow } from "@/lib/entitlements/load";
import { t } from "@/lib/i18n";

export default async function DashboardGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSessionOrNull();
  if (!session) {
    redirect("/?login=1");
  }

  const copy = t("dashboard");
  let displayName = session.email;
  let plan: Plan = "FREE";
  try {
    const membership = await requireOrganization(session);
    displayName = membership.user.name?.trim() || session.email;
    plan = planFromRow(membership.organization.subscription);
  } catch {
    displayName = copy.fallbackName;
  }

  return (
    <AppShell displayName={displayName} plan={plan}>
      {children}
    </AppShell>
  );
}
