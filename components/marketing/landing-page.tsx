import { FaqSection } from "@/components/marketing/faq-section";
import { FigmaIcon } from "@/components/marketing/figma-icon";
import { PricingSection } from "@/components/marketing/pricing-section";
import { PublicChrome } from "@/components/marketing/public-chrome";
import { CreateInvoiceButton, OpenAuthButton, UseTemplateButton } from "@/components/marketing/public-ctas";
import { TemplateInvoiceMockup } from "@/components/marketing/template-invoice-mockup";
import { UiMockup } from "@/components/marketing/ui-mockup";
import { InvoiceBuilder } from "@/components/invoice-builder/invoice-builder";
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
  const footer = t("footer");

  const featureCards = [
    {
      src: "/landing/feature-create.svg",
      title: features.createTitle,
      body: features.createBody,
      width: 36,
      height: 40,
    },
    {
      src: "/landing/feature-send.svg",
      title: features.sendTitle,
      body: features.sendBody,
      width: 38,
      height: 32,
    },
    {
      src: "/landing/feature-track.svg",
      title: features.trackTitle,
      body: features.trackBody,
      width: 36,
      height: 36,
    },
    {
      src: "/landing/feature-reminders.svg",
      title: features.remindTitle,
      body: features.remindBody,
      width: 40,
      height: 40,
    },
  ];

  const templateCards = [
    { name: templates.minimal, id: "MINIMAL" as const, previewLabel: templates.minimalPreview },
    { name: templates.professional, id: "PROFESSIONAL" as const, previewLabel: templates.professionalPreview },
    { name: templates.premium, id: "PREMIUM" as const, previewLabel: templates.premiumPreview },
  ];

  const whyLeft = why.items.slice(0, 5);
  const whyRight = why.items.slice(5);

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
          <CreateInvoiceButton className="inline-flex rounded-full bg-[#006c49] px-8 py-4 text-[12px] font-semibold tracking-[0.6px] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
            {hero.cta}
          </CreateInvoiceButton>
        </div>
      </section>

      <InvoiceBuilder paged />

      <section id="features" className="scroll-mt-24 flex w-full max-w-[1280px] flex-col gap-8 px-5 pb-12 pt-24 sm:px-10">
        <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
          {features.title}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="flex flex-col items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-[25px] text-center"
            >
              <FigmaIcon src={card.src} alt="" width={card.width} height={card.height} />
              <h3 className="text-[24px] font-semibold leading-8 text-black">{card.title}</h3>
              <p className="text-[14px] leading-5 text-[#45464d]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full bg-[#eff4ff] px-5 py-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8">
          <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
            {how.title}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", title: how.step1 },
              { n: "02", title: how.step2 },
              { n: "03", title: how.step3 },
            ].map((step) => (
              <article
                key={step.n}
                className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
              >
                <p className="font-mono text-[14px] font-medium leading-5 text-[#45464d]">{step.n}</p>
                <h3 className="text-[24px] font-semibold leading-8">{step.title}</h3>
                <UiMockup label={how.mockup} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-5 pt-12 lg:flex-row lg:px-10">
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">{why.title}</h2>
          <p className="text-[18px] leading-7 text-[#45464d]">{why.body}</p>
        </div>
        <div className="flex flex-1 gap-4">
          {[whyLeft, whyRight].map((column) => (
            <ul key={column[0]} className="flex flex-1 flex-col gap-2">
              {column.map((item) => (
                <li key={item} className="flex items-center gap-1 text-[14px] leading-5 text-[#45464d]">
                  <FigmaIcon src="/landing/check.svg" alt="" width={20} height={20} />
                  {item}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

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
                <TemplateInvoiceMockup template={card.id} label={card.previewLabel} />
                <h3 className="pt-[10px] text-center text-[24px] font-semibold leading-8">{card.name}</h3>
                <span className="mx-auto mt-2 rounded bg-[#6cf8bb] px-2 py-1 text-[12px] font-semibold tracking-[0.6px] text-[#006c49]">
                  {templates.free}
                </span>
                <UseTemplateButton
                  template={card.id}
                  className="mt-4 flex items-center justify-center rounded border border-[#e2e8f0] py-[9px] text-[12px] font-semibold tracking-[0.6px] text-black"
                >
                  {templates.use}
                </UseTemplateButton>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="stripe" className="flex w-full max-w-[1280px] flex-col items-center gap-4 px-5 py-12 sm:px-10">
        <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
          {stripe.title}
        </h2>
        <div className="flex w-full max-w-[768px] flex-col items-center justify-between gap-6 rounded-xl border border-[#e2e8f0] bg-[#eff4ff] px-8 py-8 sm:flex-row sm:px-[33px] sm:pb-[41px] sm:pt-[33px]">
          <div className="flex flex-col items-center gap-1">
            <FigmaIcon src="/landing/flow-customer.svg" alt="" width={32} height={32} />
            <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">{stripe.customer}</p>
          </div>
          <FigmaIcon src="/landing/arrow.svg" alt="" width={16} height={16} />
          <div className="flex flex-col items-center gap-1">
            <FigmaIcon src="/landing/flow-stripe.svg" alt="" width={40} height={32} />
            <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">{stripe.stripe}</p>
          </div>
          <FigmaIcon src="/landing/arrow.svg" alt="" width={16} height={16} />
          <div className="flex flex-col items-center gap-1">
            <FigmaIcon src="/landing/flow-business.svg" alt="" width={40} height={36} />
            <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">{stripe.business}</p>
          </div>
        </div>
        <p className="max-w-[640px] text-center text-[14px] leading-5 text-[#45464d]">{stripe.note}</p>
        <OpenAuthButton
          intent="login"
          className="inline-flex rounded-full bg-black px-8 py-4 text-[12px] font-semibold tracking-[0.6px] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
        >
          {stripe.cta}
        </OpenAuthButton>
      </section>

      <section className="w-full border-t border-[#e2e8f0] bg-white px-5 py-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 lg:flex-row">
          <UiMockup label={tracking.mockup} className="flex-1 rounded-xl border border-[#e2e8f0] bg-[#e5eeff]" heightClassName="h-[320px]" />
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">{tracking.title}</h2>
            <p className="text-[18px] leading-7 text-[#45464d]">{tracking.body}</p>
          </div>
        </div>
      </section>

      <section className="w-full bg-white px-5 py-12 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col-reverse items-center gap-8 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
              {reminders.title}{" "}
              <span className="align-top text-[14px] font-semibold leading-5 text-[#0070f3]">{reminders.badge}</span>
            </h2>
            <p className="text-[18px] leading-7 text-[#45464d]">{reminders.body}</p>
          </div>
          <UiMockup label={reminders.mockup} className="flex-1 rounded-xl border border-[#e2e8f0] bg-[#e5eeff]" heightClassName="h-[320px]" />
        </div>
      </section>

      <section className="w-full bg-[#e5eeff] px-5 py-12 sm:px-10">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-8 lg:grid-cols-2">
          <article className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[25px]">
            <h3 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
              {clientsReports.clientsTitle}
            </h3>
            <UiMockup
              label={clientsReports.clientsMockup}
              className="rounded border border-[#e2e8f0] bg-[#eff4ff] text-[#0b1c30]"
              heightClassName="h-48"
            />
            <a
              href="#features"
              className="inline-flex w-fit items-center justify-center rounded border border-[#e2e8f0] px-[17px] py-[9px] text-[12px] font-semibold tracking-[0.6px] text-black"
            >
              {clientsReports.clientsCta}
            </a>
          </article>
          <article className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[25px]">
            <h3 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
              {clientsReports.reportsTitle}
            </h3>
            <UiMockup
              label={clientsReports.reportsMockup}
              className="rounded border border-[#e2e8f0] bg-[#eff4ff] text-[#0b1c30]"
              heightClassName="h-48"
            />
            <p className="text-[14px] leading-5 text-[#45464d]">{clientsReports.reportsNote}</p>
          </article>
        </div>
      </section>

      <PricingSection />

      <section className="w-full bg-[#1e293b] px-5 py-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center gap-6 sm:flex-row sm:gap-6">
          <div className="flex items-center gap-1 text-[14px] leading-5 text-white">
            <FigmaIcon src="/landing/trust-stripe.svg" alt="" width={16} height={21} />
            {trust.stripe}
          </div>
          <div className="flex items-center gap-1 text-[14px] leading-5 text-white">
            <FigmaIcon src="/landing/trust-gdpr.svg" alt="" width={16} height={20} />
            {trust.gdpr}
          </div>
          <div className="flex items-center gap-1 text-[14px] leading-5 text-white">
            <FigmaIcon src="/landing/trust-data.svg" alt="" width={16} height={20} />
            {trust.data}
          </div>
        </div>
      </section>

      <FaqSection />

      <section className="mx-auto flex w-full max-w-[896px] flex-col items-center gap-6 px-5 py-12 sm:px-10">
        <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
          {finalCta.title}
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row">
          <CreateInvoiceButton className="inline-flex rounded-full bg-black px-8 py-4 text-center text-[12px] font-semibold tracking-[0.6px] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]">
            {finalCta.create}
          </CreateInvoiceButton>
          <a
            href="#pricing"
            className="inline-flex rounded-full border border-[#e2e8f0] bg-[#eff4ff] px-[33px] py-[17px] text-center text-[12px] font-semibold tracking-[0.6px] text-black"
          >
            {finalCta.pricing}
          </a>
        </div>
      </section>

      <footer className="w-full bg-[#131b2e]">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-6 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-10">
          <div className="col-span-2 flex flex-col gap-4">
            <p className="text-[24px] font-semibold leading-8 text-white">{footer.brand}</p>
            <p className="max-w-[320px] text-[14px] leading-5 text-[#eaf1ff] opacity-80">{footer.tagline}</p>
            <a href="https://puyer.org" className="opacity-80" aria-label={footer.brand}>
              <FigmaIcon src="/landing/social.svg" alt="" width={20} height={20} />
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold tracking-[0.6px] text-white">{footer.product}</p>
            <ul className="flex flex-col gap-1 text-[14px] leading-5 text-[#eaf1ff] opacity-80">
              <li>
                <a href="#features">{footer.features}</a>
              </li>
              <li>
                <a href="#pricing">{footer.pricing}</a>
              </li>
              <li>
                <a href="#templates">{footer.templates}</a>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold tracking-[0.6px] text-white">{footer.company}</p>
            <ul className="flex flex-col gap-1 text-[14px] leading-5 text-[#eaf1ff] opacity-80">
              <li>{footer.about}</li>
              <li>{footer.contact}</li>
              <li>{footer.careers}</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold tracking-[0.6px] text-white">{footer.legal}</p>
            <ul className="flex flex-col gap-1 text-[14px] leading-5 text-[#eaf1ff] opacity-80">
              <li>{footer.privacy}</li>
              <li>{footer.terms}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#565e74] py-4 opacity-50">
          <p className="text-center text-[14px] leading-5 text-[#eaf1ff]">{footer.copyright}</p>
        </div>
      </footer>
    </main>
    </PublicChrome>
  );
}
