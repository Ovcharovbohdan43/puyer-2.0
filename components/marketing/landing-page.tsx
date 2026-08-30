import { FaqSection } from "@/components/marketing/faq-section";
import { InvoiceBuilder } from "@/components/invoice-builder/invoice-builder";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { LandingStudioShot } from "@/components/marketing/landing-studio-shot";
import { PricingSection } from "@/components/marketing/pricing-section";
import { PublicChrome } from "@/components/marketing/public-chrome";
import { CreateInvoiceButton, UseTemplateButton } from "@/components/marketing/public-ctas";
import { FeaturesMarquee, landingFeatureCards } from "@/components/marketing/features-marquee";
import { LandingTemplateMockup } from "@/components/marketing/landing-template-mockup";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { WhyBenefits } from "@/components/marketing/why-benefits";
import { StripeFlow } from "@/components/marketing/stripe-flow";
import { TrustBar } from "@/components/marketing/trust-bar";
import { t } from "@/lib/i18n";

export function LandingPage() {
  const hero = t("hero");
  const features = t("features");
  const how = t("how");
  const why = t("why");
  const templates = t("templates");
  const stripe = t("stripe");
  const tracking = t("tracking");
  const reminders = t("reminders");
  const clientsReports = t("clientsReports");
  const trust = t("trust");
  const finalCta = t("finalCta");

  const featureCards = landingFeatureCards(features);

  const templateCards = [
    { name: templates.minimal, id: "MINIMAL" as const, previewLabel: templates.minimalPreview },
    { name: templates.professional, id: "PROFESSIONAL" as const, previewLabel: templates.professionalPreview },
    { name: templates.premium, id: "PREMIUM" as const, previewLabel: templates.premiumPreview },
  ];

  return (
    <PublicChrome>
    <main className="flex flex-col items-center bg-white text-black">
      <section className="flex w-full max-w-[1280px] flex-col items-center gap-4 px-5 pb-8 pt-12 sm:px-10">
        <h1 className="max-w-[896px] text-center text-[40px] font-bold leading-[48px] tracking-[-1.6px] text-black sm:text-[64px] sm:leading-[72px]">
          {hero.titleLine1}
          <br />
          {hero.titleLine2}
        </h1>
        <p className="max-w-[672px] text-center text-[18px] leading-7 text-[#45464d]">{hero.subtitle}</p>
        <div className="pt-4">
          <CreateInvoiceButton className="landing-btn landing-btn--green inline-flex rounded-full bg-[#006c49] px-8 py-4 text-[12px] font-semibold tracking-[0.6px] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
            {hero.cta}
          </CreateInvoiceButton>
        </div>
      </section>

      <InvoiceBuilder paged />

      <section id="features" className="scroll-mt-24 flex w-full flex-col gap-0 pb-12 pt-24">
        <h2 className="mx-auto max-w-[1280px] px-5 text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:px-10 sm:text-[32px]">
          {features.title}
        </h2>
        <FeaturesMarquee cards={featureCards} />
      </section>

      <HowItWorks how={how} />

      <WhyBenefits title={why.title} body={why.body} items={why.items} />

      <section id="templates" className="scroll-mt-24 mt-12 w-full bg-[#e5eeff] px-5 pb-12 pt-24 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8">
          <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
            {templates.title}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {templateCards.map((card) => (
              <article
                key={card.name}
                className="group flex h-auto flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
              >
                <LandingTemplateMockup template={card.id} label={card.previewLabel} />
                <h3 className="pt-[10px] text-center text-[24px] font-semibold leading-8">{card.name}</h3>
                <span className="mx-auto mt-2 rounded bg-[#6cf8bb] px-2 py-1 text-[12px] font-semibold tracking-[0.6px] text-[#006c49]">
                  {templates.free}
                </span>
                <UseTemplateButton
                  template={card.id}
                  className="landing-btn landing-btn--ghost mt-4 flex items-center justify-center rounded border border-[#e2e8f0] py-[9px] text-[12px] font-semibold tracking-[0.6px] text-black"
                >
                  {templates.use}
                </UseTemplateButton>
              </article>
            ))}
          </div>
        </div>
      </section>

      <StripeFlow stripe={stripe} />

      <section className="w-full border-t border-[#e2e8f0] bg-white px-5 py-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 lg:flex-row">
          <LandingReveal className="w-full min-w-0 flex-1" from="left">
            <LandingStudioShot src="/landing/tracking-payments.jpg" alt={tracking.imageAlt} />
          </LandingReveal>
          <LandingReveal className="flex flex-1 flex-col gap-4" delayMs={120} from="right">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">{tracking.title}</h2>
            <p className="text-[18px] leading-7 text-[#45464d]">{tracking.body}</p>
          </LandingReveal>
        </div>
      </section>

      <section className="w-full bg-white px-5 py-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col-reverse items-center gap-8 lg:flex-row">
          <LandingReveal className="flex flex-1 flex-col gap-4" delayMs={120} from="left">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
              {reminders.title}{" "}
              <span className="align-top text-[14px] font-semibold leading-5 text-[#0070f3]">{reminders.badge}</span>
            </h2>
            <p className="text-[18px] leading-7 text-[#45464d]">{reminders.body}</p>
          </LandingReveal>
          <LandingReveal className="w-full min-w-0 flex-1" from="right">
            <LandingStudioShot src="/landing/reminders-pro.jpg" alt={reminders.imageAlt} />
          </LandingReveal>
        </div>
      </section>

      <section className="w-full overflow-x-hidden bg-white px-5 py-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 lg:flex-row">
          <LandingReveal className="w-full min-w-0 flex-1" from="left">
            <LandingStudioShot src="/landing/clients.png" alt={clientsReports.clientsImageAlt} />
          </LandingReveal>
          <LandingReveal className="flex flex-1 flex-col gap-4" delayMs={120} from="right">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
              {clientsReports.clientsTitle}
            </h2>
          </LandingReveal>
        </div>
      </section>

      <section className="w-full overflow-x-hidden bg-white px-5 pb-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col-reverse items-center gap-8 lg:flex-row">
          <LandingReveal className="flex flex-1 flex-col gap-4" delayMs={120} from="left">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
              {clientsReports.reportsTitle}
            </h2>
            <p className="text-[18px] leading-7 text-[#45464d]">{clientsReports.reportsNote}</p>
          </LandingReveal>
          <LandingReveal className="w-full min-w-0 flex-1" from="right">
            <LandingStudioShot src="/landing/reports.png" alt={clientsReports.reportsImageAlt} />
          </LandingReveal>
        </div>
      </section>

      <PricingSection />

      <TrustBar trust={trust} />

      <FaqSection />

      <section className="mx-auto flex w-full max-w-[896px] flex-col items-center gap-6 px-5 py-12 sm:px-10">
        <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
          {finalCta.title}
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <CreateInvoiceButton className="landing-btn landing-btn--black inline-flex rounded-full bg-black px-8 py-4 text-center text-[12px] font-semibold tracking-[0.6px] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
            {finalCta.create}
          </CreateInvoiceButton>
          <a
            href="#pricing"
            className="landing-btn landing-btn--soft inline-flex rounded-full border border-[#e2e8f0] bg-[#eff4ff] px-[33px] py-[17px] text-center text-[12px] font-semibold tracking-[0.6px] text-black"
          >
            {finalCta.pricing}
          </a>
        </div>
      </section>
    </main>
    </PublicChrome>
  );
}
