"use client";

import { useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { LightningIcon } from "@phosphor-icons/react/dist/csr/Lightning";
import { ReceiptIcon } from "@phosphor-icons/react/dist/csr/Receipt";

import { PuyerBusyText } from "@/components/brand/puyer-spinner";
import { useBuilderSession } from "@/components/invoice-builder/builder-session";
import { t } from "@/lib/i18n";

type PlanId = "FREE" | "PRO" | "BUSINESS";

type Plan = {
  id: PlanId;
  name: string;
  monthly: number;
  yearly: number;
  features: string[];
  cta: string;
  Icon: Icon;
  color: string;
  highlighted?: boolean;
};

export function PricingSection() {
  const copy = t("pricing");
  const billing = t("billing");
  const [yearly, setYearly] = useState(false);
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { authenticated, startInvoice, requestNavigate } = useBuilderSession();

  const plans: Plan[] = [
    {
      id: "FREE",
      name: copy.free,
      monthly: 0,
      yearly: 0,
      features: copy.freeFeatures,
      cta: copy.getStarted,
      Icon: ReceiptIcon,
      color: "#0b1c30",
    },
    {
      id: "PRO",
      name: copy.pro,
      monthly: 9,
      yearly: 90,
      features: copy.proFeatures,
      cta: copy.subscribe,
      Icon: LightningIcon,
      color: "#006c49",
      highlighted: true,
    },
    {
      id: "BUSINESS",
      name: copy.business,
      monthly: 29,
      yearly: 290,
      features: copy.businessFeatures,
      cta: copy.subscribe,
      Icon: BuildingsIcon,
      color: "#2563eb",
    },
  ];

  async function subscribe(plan: PlanId) {
    if (plan === "FREE") {
      startInvoice();
      return;
    }
    if (!authenticated) {
      requestNavigate("/login?intent=subscribe");
      return;
    }
    setPending(plan);
    setError(null);
    try {
      const response = await fetch("/api/stripe/platform/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: yearly ? "year" : "month" }),
      });
      const body = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error || billing.checkoutFailed);
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError(billing.checkoutFailed);
    } finally {
      setPending(null);
    }
  }

  return (
    <section id="pricing" className="pricing-section scroll-mt-24 w-full bg-[#eff4ff] px-5 py-16 sm:px-10 sm:py-20">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8">
        <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] text-black sm:text-[32px]">
          {copy.title}
        </h2>
        <div
          className="pricing-interval inline-flex rounded-full border border-[#e2e8f0] bg-white p-1 shadow-[0px_1px_2px_rgba(15,23,42,0.06)]"
          role="group"
          aria-label={`${copy.monthly}, ${copy.yearly}`}
        >
          <button
            type="button"
            className={`landing-btn landing-btn--nav rounded-full px-5 py-2 text-[12px] font-semibold tracking-[0.6px] ${
              yearly ? "text-[#45464d]" : "bg-[#0b1c30] text-white"
            }`}
            aria-pressed={!yearly}
            onClick={() => setYearly(false)}
          >
            {copy.monthly}
          </button>
          <button
            type="button"
            className={`landing-btn landing-btn--nav rounded-full px-5 py-2 text-[12px] font-semibold tracking-[0.6px] ${
              yearly ? "bg-[#0b1c30] text-white" : "text-[#45464d]"
            }`}
            aria-pressed={yearly}
            onClick={() => setYearly(true)}
          >
            {copy.yearly}
          </button>
        </div>
        {error ? (
          <p className="text-center text-[14px] leading-5 text-[#b42318]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            const suffix = yearly ? copy.perYear : copy.perMonth;
            return (
              <article
                key={plan.id}
                className={`pricing-card relative flex h-full flex-col gap-4 rounded-2xl border bg-white p-6 sm:p-7 ${
                  plan.highlighted
                    ? "pricing-card--featured border-[#006c49] shadow-[0px_16px_40px_-24px_rgba(0,108,73,0.55)]"
                    : "border-[#e2e8f0] shadow-[0px_1px_2px_rgba(15,23,42,0.06)]"
                }`}
              >
                {plan.highlighted ? (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6cf8bb] px-3 py-1 text-[10px] font-semibold tracking-[0.08em] text-[#006c49]">
                    {copy.popular}
                  </span>
                ) : null}
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-12 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_rgba(15,23,42,0.06)]">
                    <plan.Icon size={24} weight="duotone" color={plan.color} aria-hidden />
                  </span>
                  <h3 className="text-[20px] font-semibold leading-7 tracking-[0.04em] text-black">{plan.name}</h3>
                </div>
                <p className="flex items-end gap-1 tracking-[-0.96px]">
                  <span className="text-[48px] font-bold leading-[56px] text-black">${price}</span>
                  <span className="mb-2 text-[16px] leading-6 text-[#45464d]">{suffix}</span>
                </p>
                <ul className="flex flex-1 flex-col gap-2.5 pb-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[14px] leading-5 text-[#0b1c30]">
                      <CheckCircleIcon
                        size={18}
                        weight="duotone"
                        color={plan.highlighted ? "#006c49" : "#64748b"}
                        className="mt-0.5 shrink-0"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => void subscribe(plan.id)}
                  className={`landing-btn mt-auto flex w-full items-center justify-center rounded-full py-3 text-[12px] font-semibold tracking-[0.6px] disabled:opacity-60 ${
                    plan.highlighted
                      ? "landing-btn--green bg-[#006c49] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
                      : "landing-btn--ghost border border-[#e2e8f0] text-black"
                  }`}
                >
                  <PuyerBusyText busy={pending === plan.id} busyLabel={billing.redirecting} idle={plan.cta} />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
