import type { Icon } from "@phosphor-icons/react";
import { BellRingingIcon } from "@phosphor-icons/react/dist/ssr/BellRinging";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";

export type FeatureMarqueeCard = {
  title: string;
  body: string;
  Icon: Icon;
  color: string;
};

export function landingFeatureCards(copy: {
  createTitle: string;
  createBody: string;
  sendTitle: string;
  sendBody: string;
  trackTitle: string;
  trackBody: string;
  remindTitle: string;
  remindBody: string;
}): FeatureMarqueeCard[] {
  return [
    { title: copy.createTitle, body: copy.createBody, Icon: ReceiptIcon, color: "#2563eb" },
    { title: copy.sendTitle, body: copy.sendBody, Icon: PaperPlaneTiltIcon, color: "#006c49" },
    { title: copy.trackTitle, body: copy.trackBody, Icon: ChartLineUpIcon, color: "#ca8a04" },
    { title: copy.remindTitle, body: copy.remindBody, Icon: BellRingingIcon, color: "#0b1c30" },
  ];
}

export function FeaturesMarquee({ cards }: { cards: FeatureMarqueeCard[] }) {
  return (
    <div className="features-marquee mt-8" aria-label="Product features">
      <div className="features-marquee-track">
        <FeatureMarqueeSet cards={cards} />
        <FeatureMarqueeSet cards={cards} clone />
      </div>
    </div>
  );
}

function FeatureMarqueeSet({
  cards,
  clone = false,
}: {
  cards: FeatureMarqueeCard[];
  clone?: boolean;
}) {
  return (
    <div className="features-marquee-set" aria-hidden={clone || undefined}>
      {cards.map((card) => (
        <article
          key={`${clone ? "clone-" : ""}${card.title}`}
          className="flex w-[min(20rem,80vw)] shrink-0 flex-col items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-[25px] text-center"
        >
          <card.Icon size={40} weight="duotone" color={card.color} aria-hidden />
          <h3 className="text-[24px] font-semibold leading-8 text-black">{card.title}</h3>
          <p className="text-[14px] leading-5 text-[#45464d]">{card.body}</p>
        </article>
      ))}
    </div>
  );
}
