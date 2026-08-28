"use client";

import { useState } from "react";

import { FigmaIcon } from "@/components/marketing/figma-icon";
import { t } from "@/lib/i18n";

export function FaqSection() {
  const copy = t("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
      <section id="faq" className="scroll-mt-24 mx-auto flex w-full max-w-[768px] flex-col gap-8 px-5 py-12 sm:px-10">
      <h2 className="text-center text-[28px] font-semibold leading-10 tracking-[-0.32px] text-black sm:text-[32px]">
        {copy.title}
      </h2>
      <div className="flex w-full flex-col gap-2">
        {copy.items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div
              key={item.q}
              className="rounded border border-[#e2e8f0] bg-white p-[17px]"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 text-left"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className="text-[16px] font-bold leading-6 text-black">{item.q}</span>
                <FigmaIcon
                  src="/landing/faq-chevron.svg"
                  alt=""
                  width={12}
                  height={8}
                  className={open ? "rotate-180" : ""}
                />
              </button>
              {open ? (
                <p className="mt-3 text-[14px] leading-5 text-[#45464d]">{item.a}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
