import { redirect } from "next/navigation";

import { PricingSection } from "@/components/marketing/pricing-section";
import { PublicChrome } from "@/components/marketing/public-chrome";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { needsOnboarding } from "@/lib/onboarding/input";
import { t } from "@/lib/i18n";

export const metadata = {
  title: "Pricing — Puyer",
  description: t("meta").description,
};

export default async function PricingPage() {
  const session = await getSessionOrNull();
  if (session) {
    let membership = null;
    try {
      membership = await requireOrganization(session);
    } catch {
      membership = null;
    }
    if (membership && needsOnboarding(membership.user.onboardingCompletedAt)) {
      redirect("/onboarding?next=/pricing");
    }
  }
  return (
    <PublicChrome>
      <main className="min-h-screen bg-white pb-16">
        <PricingSection />
      </main>
    </PublicChrome>
  );
}
