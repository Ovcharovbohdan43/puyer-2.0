import { PricingSection } from "@/components/marketing/pricing-section";
import { PublicChrome } from "@/components/marketing/public-chrome";
import { t } from "@/lib/i18n";

export const metadata = {
  title: "Pricing — Puyer",
  description: t("meta").description,
};

export default function PricingPage() {
  return (
    <PublicChrome>
      <main className="min-h-screen bg-white pb-16">
        <PricingSection />
      </main>
    </PublicChrome>
  );
}
