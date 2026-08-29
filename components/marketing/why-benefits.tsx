import type { Icon } from "@phosphor-icons/react";
import { BellRingingIcon } from "@phosphor-icons/react/dist/ssr/BellRinging";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { CurrencyCircleDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyCircleDollar";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { InfinityIcon } from "@phosphor-icons/react/dist/ssr/Infinity";
import { PercentIcon } from "@phosphor-icons/react/dist/ssr/Percent";
import { ShareNetworkIcon } from "@phosphor-icons/react/dist/ssr/ShareNetwork";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { UserMinusIcon } from "@phosphor-icons/react/dist/ssr/UserMinus";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

export type WhyChip = {
  label: string;
  Icon: Icon;
  color: string;
};

const WHY_ICONS: Icon[] = [
  UserMinusIcon,
  InfinityIcon,
  SquaresFourIcon,
  EyeIcon,
  CurrencyCircleDollarIcon,
  PercentIcon,
  UsersThreeIcon,
  ShareNetworkIcon,
  ChartLineUpIcon,
  BellRingingIcon,
];

const WHY_COLORS = [
  "#2563eb",
  "#006c49",
  "#7c3aed",
  "#0b1c30",
  "#ca8a04",
  "#0070f3",
  "#006c49",
  "#2563eb",
  "#0b1c30",
  "#ca8a04",
];

export function whyBenefitChips(items: string[]): WhyChip[] {
  return items.map((label, index) => ({
    label,
    Icon: WHY_ICONS[index] ?? EyeIcon,
    color: WHY_COLORS[index] ?? "#006c49",
  }));
}

export function WhyBenefits({
  title,
  body,
  items,
}: {
  title: string;
  body: string;
  items: string[];
}) {
  const chips = whyBenefitChips(items);
  const top = chips.slice(0, 5);
  const bottom = chips.slice(5);

  return (
    <section className="why-benefits flex w-full flex-col gap-10 py-16">
      <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-5 text-center sm:px-10">
        <h2 className="text-[28px] font-semibold leading-10 tracking-[-0.32px] sm:text-[32px]">{title}</h2>
        <p className="text-[18px] leading-7 text-[#45464d]">{body}</p>
      </div>
      <div className="why-marquee-stack flex flex-col gap-3">
        <WhyChipMarquee chips={top.length ? top : chips} />
        {bottom.length ? <WhyChipMarquee chips={bottom} reverse /> : null}
      </div>
    </section>
  );
}

function WhyChipMarquee({ chips, reverse = false }: { chips: WhyChip[]; reverse?: boolean }) {
  return (
    <div className="features-marquee">
      <div
        className={`features-marquee-track why-chip-track ${reverse ? "why-chip-track-reverse" : ""}`}
      >
        <WhyChipSet chips={chips} />
        <WhyChipSet chips={chips} clone />
      </div>
    </div>
  );
}

function WhyChipSet({ chips, clone = false }: { chips: WhyChip[]; clone?: boolean }) {
  return (
    <div className="features-marquee-set" aria-hidden={clone || undefined}>
      {chips.map((chip) => (
        <span
          key={`${clone ? "clone-" : ""}${chip.label}`}
          className="why-chip inline-flex shrink-0 items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-4 py-2.5 text-[14px] leading-5 font-medium text-[#0b1c30] shadow-[0px_1px_2px_rgba(15,23,42,0.04)]"
        >
          <chip.Icon size={20} weight="duotone" color={chip.color} aria-hidden />
          {chip.label}
        </span>
      ))}
    </div>
  );
}
