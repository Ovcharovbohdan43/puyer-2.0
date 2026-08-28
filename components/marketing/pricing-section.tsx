"use client";

import { useState } from "react";

import { FigmaIcon } from "@/components/marketing/figma-icon";
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
  highlighted?: boolean;
};

export function PricingSection() {
  const copy = t("pricing");
  const billing = t("billing");
  const [yearly, setYearly] = useState(false);
  const [pending, setPending] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { authenticated, startInvoice, openAuth } = useBuilderSession();

  const plans: Plan[] = [
    {
      id: "FREE",
      name: copy.free,
      monthly: 0,
      yearly: 0,
      features: copy.freeFeatures,
      cta: copy.getStarted,
    },
    {
      id: "PRO",
      name: copy.pro,
      monthly: 9,
      yearly: 90,
      features: copy.proFeatures,
      cta: copy.subscribe,
      highlighted: true,
    },
    {
      id: "BUSINESS",
      name: copy.business,
      monthly: 29,
      yearly: 290,
      features: copy.businessFeatures,
      cta: copy.subscribe,
    },
  ];

  async function subscribe(plan: PlanId) {
    if (plan === "FREE") {
      startInvoice();
      return;
    }
    if (!authenticated) {
      openAuth("subscribe");
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
    <section id="pricing" className="scroll-mt-24 mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-5 py-12 sm:px-10">
      <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] text-black sm:text-[32px]">
        {copy.title}
      </h2>
      <div className="flex items-center justify-center gap-2">
        <span className="text-[14px] leading-5 text-[#0b1c30]">{copy.monthly}</span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label={yearly ? copy.yearly : copy.monthly}
          onClick={() => setYearly((value) => !value)}
          className={`flex h-6 w-12 items-center rounded-full bg-black p-1 ${yearly ? "justify-end" : "justify-start"}`}
        >
          <span className="theme-knob size-4 rounded-full bg-white" />
        </button>
        <span className="text-[14px] leading-5 text-[#0b1c30]">{copy.yearly}</span>
      </div>
      {error ? (
        <p className="text-center text-[14px] leading-5 text-[#b42318]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col items-stretch justify-center gap-6 pt-4 lg:flex-row">
        {plans.map((plan) => {
          const price = yearly ? plan.yearly : plan.monthly;
          const suffix = yearly ? copy.perYear : copy.perMonth;
          return (
            <article
              key={plan.id}
              className={`relative flex flex-1 flex-col gap-1 rounded-xl bg-white p-[25px] ${
                plan.highlighted ? "border-2 border-black p-[26px]" : "border border-[#e2e8f0]"
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute left-1/2 top-[-12px] -translate-x-1/2 rounded-full bg-black px-2 py-1 text-[10px] leading-[15px] tracking-normal text-white">
                  {copy.popular}
                </span>
              ) : null}
              <h3 className="text-[24px] font-semibold leading-8 text-black">{plan.name}</h3>
              <p className="flex h-14 items-end gap-1 tracking-[-0.96px]">
                <span className="text-[48px] font-bold leading-[56px] text-black">${price}</span>
                <span className="mb-2 text-[16px] leading-6 text-[#45464d]">{suffix}</span>
              </p>
              <ul className="flex flex-col gap-[7.5px] pb-5 pt-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1 text-[14px] leading-5 text-[#0b1c30]">
                    <FigmaIcon src="/landing/plan-check.svg" alt="" width={11} height={8} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void subscribe(plan.id)}
                className={`mt-auto flex w-full items-center justify-center rounded py-[9px] text-[12px] font-semibold tracking-[0.6px] disabled:opacity-60 ${
                  plan.highlighted
                    ? "bg-black py-2 text-white"
                    : "border border-black text-black"
                }`}
              >
                {pending === plan.id ? billing.redirecting : plan.cta}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
