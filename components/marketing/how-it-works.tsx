import Image from "next/image";
import type { Icon } from "@phosphor-icons/react";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr/PencilSimple";

import { LandingReveal } from "@/components/marketing/landing-reveal";

type HowCopy = {
  title: string;
  step1: string;
  step2: string;
  step3: string;
  step1Alt: string;
  step2Alt: string;
  step3Alt: string;
};

type HowStep = {
  n: string;
  title: string;
  alt: string;
  src: string;
  Icon: Icon;
  color: string;
};

export function HowItWorks({ how }: { how: HowCopy }) {
  const steps: HowStep[] = [
    {
      n: "01",
      title: how.step1,
      alt: how.step1Alt,
      src: "/landing/how-create.png",
      Icon: PencilSimpleIcon,
      color: "#006c49",
    },
    {
      n: "02",
      title: how.step2,
      alt: how.step2Alt,
      src: "/landing/how-send.png",
      Icon: PaperPlaneTiltIcon,
      color: "#2563eb",
    },
    {
      n: "03",
      title: how.step3,
      alt: how.step3Alt,
      src: "/landing/how-get-paid.png",
      Icon: CheckCircleIcon,
      color: "#ca8a04",
    },
  ];

  return (
    <section className="how-it-works w-full bg-[#eff4ff] px-5 py-16 sm:px-10 sm:py-20">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12">
        <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">
          {how.title}
        </h2>
        <ol className="how-steps relative m-0 grid list-none grid-cols-1 gap-10 p-0 md:grid-cols-3 md:gap-6">
          <div className="how-steps-line" aria-hidden />
          {steps.map((step, index) => (
            <li key={step.n} className="min-w-0">
              <LandingReveal delayMs={index * 90} from="up" className="h-full">
                <div className="how-step group flex h-full flex-col items-center gap-4 text-center">
                  <div className="how-step-head relative z-[1] flex flex-col items-center gap-2">
                    <span className="inline-flex size-14 items-center justify-center rounded-full border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_rgba(15,23,42,0.06)]">
                      <step.Icon size={28} weight="duotone" color={step.color} aria-hidden />
                    </span>
                    <p className="font-mono text-[13px] font-medium tracking-[0.08em] text-[#64748b]">{step.n}</p>
                    <h3 className="text-[24px] font-semibold leading-8 text-black">{step.title}</h3>
                  </div>
                  <div className="how-step-shot relative h-[220px] w-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white sm:h-[260px]">
                    <Image
                      src={step.src}
                      alt={step.alt}
                      fill
                      className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      sizes="(min-width: 768px) 33vw, 100vw"
                    />
                  </div>
                </div>
              </LandingReveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
