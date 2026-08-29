import type { Plan } from "@prisma/client";

import { AppShell } from "@/components/dashboard/app-shell";
import { HelpScreen } from "@/components/help/help-screen";
import { PublicChrome } from "@/components/marketing/public-chrome";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { planFromOrganization } from "@/lib/entitlements/load";
import { listMySupportRequests } from "@/lib/help/service";
import { t } from "@/lib/i18n";

export const metadata = {
  title: "Help — Puyer",
  description: t("help").subtitle,
};

export default async function HelpPage() {
  const session = await getSessionOrNull();
  const copy = t("dashboard");
  const tickets = session ? await listMySupportRequests(session) : [];
  let displayName = session?.email ?? "";
  let plan: Plan = "FREE";
  let formName = "";
  if (session) {
    try {
      const membership = await requireOrganization(session);
      displayName = membership.user.name?.trim() || session.email;
      formName = membership.user.name?.trim() || "";
      plan = planFromOrganization(membership.organization);
    } catch {
      displayName = copy.fallbackName;
    }
  }

  const screen = (
    <HelpScreen signedIn={Boolean(session)} email={session?.email ?? ""} name={formName} tickets={tickets} />
  );

  if (!session) {
    return <PublicChrome>{screen}</PublicChrome>;
  }

  return (
    <AppShell displayName={displayName} plan={plan}>
      {screen}
    </AppShell>
  );
}
