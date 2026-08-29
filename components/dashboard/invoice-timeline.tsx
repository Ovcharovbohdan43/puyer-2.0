"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { PlusCircleIcon } from "@phosphor-icons/react/dist/csr/PlusCircle";

import { t } from "@/lib/i18n";

export type TimelineKind = "created" | "sent" | "viewed" | "reminded";

export type TimelineEvent = {
  kind: TimelineKind;
  title: string;
  date: string;
};

const ICONS: Record<TimelineKind, typeof PlusCircleIcon> = {
  created: PlusCircleIcon,
  sent: PaperPlaneTiltIcon,
  viewed: EyeIcon,
  reminded: EnvelopeSimpleIcon,
};

export function InvoiceTimeline({ events }: { events: TimelineEvent[] }) {
  const copy = t("dashboard");
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-[12px] font-semibold tracking-[0.4px] text-[#6B7280] uppercase">{copy.timeline}</h3>
      <ol className="puyer-timeline relative flex flex-col gap-5 pl-8">
        <span aria-hidden className="puyer-timeline-track" />
        <span aria-hidden className="puyer-timeline-fill" />
        <span aria-hidden className="puyer-timeline-travel" />
        {events.map((event, index) => {
          const Icon = ICONS[event.kind] ?? CheckCircleIcon;
          return (
            <li
              key={`${event.kind}-${event.date}-${index}`}
              className="puyer-timeline-node relative flex items-start gap-3"
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <span className="absolute top-0.5 -left-8 flex size-7 items-center justify-center rounded-full bg-[#E8F5EF] text-[#006C49] ring-4 ring-white">
                <Icon size={14} weight="duotone" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[14px] leading-5 font-medium text-[#111827]">{event.title}</p>
                <p className="text-[12px] leading-[15px] text-[#6B7280]">{event.date}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
