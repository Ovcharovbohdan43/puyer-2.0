import { redirect } from "next/navigation";

import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { getSessionOrNull, requireOrganization } from "@/lib/authorization";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { needsOnboarding } from "@/lib/onboarding/input";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSessionOrNull();
  if (!session) {
    redirect("/login");
  }
  const params = await searchParams;
  const nextPath = sanitizeReturnTo(params.next);
  const membership = await requireOrganization(session);
  if (!needsOnboarding(membership.user.onboardingCompletedAt)) {
    redirect(nextPath);
  }
  const profile = membership.organization.businessProfile;

  return (
    <OnboardingScreen
      isOwner={membership.role === "OWNER"}
      name={membership.user.name?.trim() || ""}
      businessName={profile?.businessName || ""}
      businessAddress={profile?.businessAddress || ""}
      currency={profile?.defaultCurrency || "USD"}
      taxRate={profile?.defaultTaxRate || "0"}
      timezone={membership.user.timezone || "UTC"}
      nextPath={nextPath}
    />
  );
}
