import type { Icon } from "@phosphor-icons/react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CreditCardIcon } from "@phosphor-icons/react/dist/ssr/CreditCard";
import { StorefrontIcon } from "@phosphor-icons/react/dist/ssr/Storefront";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import { OpenAuthButton } from "@/components/marketing/public-ctas";

type StripeCopy = {
  title: string;
  customer: string;
  stripe: string;
  business: string;
  cta: string;
  note: string;
};

type FlowNode = {
  label: string;
  Icon: Icon;
  color: string;
};

export function StripeFlow({ stripe }: { stripe: StripeCopy }) {
  const nodes: FlowNode[] = [
    { label: stripe.customer, Icon: UserIcon, color: "#0b1c30" },
    { label: stripe.stripe, Icon: CreditCardIcon, color: "#635bff" },
    { label: stripe.business, Icon: StorefrontIcon, color: "#006c49" },
  ];

  return (
    <section id="stripe" className="stripe-flow flex w-full flex-col items-center gap-8 px-5 py-16 sm:px-10 sm:py-20">
      <h2 className="max-w-[720px] text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
        {stripe.title}
      </h2>
      <div className="w-full max-w-[768px] rounded-xl border border-[#e2e8f0] bg-[#eff4ff] px-8 py-8 sm:px-10 sm:py-9">
        <div
          className="stripe-flow-track grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-0"
          aria-label={`${stripe.customer}, ${stripe.stripe}, ${stripe.business}`}
        >
          {nodes.flatMap((node, index) => {
            const parts = [
              <div key={node.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_rgba(15,23,42,0.06)]">
                  <node.Icon size={28} weight="duotone" color={node.color} aria-hidden />
                </span>
                <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">{node.label}</p>
              </div>,
            ];
            if (index < nodes.length - 1) {
              parts.push(
                <div key={`arrow-${node.label}`} className="flex justify-center py-1 sm:px-3 sm:py-0" aria-hidden>
                  <ArrowRightIcon
                    size={20}
                    weight="bold"
                    color="#94a3b8"
                    className="rotate-90 sm:rotate-0"
                  />
                </div>,
              );
            }
            return parts;
          })}
        </div>
      </div>
      <p className="max-w-[640px] text-center text-[14px] leading-5 text-[#45464d]">{stripe.note}</p>
      <OpenAuthButton
        intent="login"
        className="landing-btn landing-btn--black inline-flex rounded-full bg-black px-8 py-4 text-[12px] font-semibold tracking-[0.6px] text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]"
      >
        {stripe.cta}
      </OpenAuthButton>
    </section>
  );
}
