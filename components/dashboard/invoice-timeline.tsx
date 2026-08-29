"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/csr/EnvelopeSimple";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { PlusCircleIcon } from "@phosphor-icons/react/dist/csr/PlusCircle";

import { t } from "@/lib/i18n";

export type TimelineKind = "created" | "sent" | "viewed" | "reminded" | "paid";

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
  paid: CheckCircleIcon,
};

export function InvoiceTimeline({ events }: { events: TimelineEvent[] }) {
  const copy = t("dashboard");
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-[12px] font-semibold tracking-[0.4px] text-[#6B7280] uppercase">{copy.timeline}</h3>
      <ol className="puyer-timeline m-0 flex list-none flex-col p-0">
        {events.map((event, index) => {
          const Icon = ICONS[event.kind] ?? CheckCircleIcon;
          const last = index === events.length - 1;
          return (
            <li key={`${event.kind}-${event.date}-${index}`} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3">
              <div className="relative flex justify-center">
                {last ? null : (
                  <span aria-hidden className="puyer-timeline-stem absolute top-7 bottom-0 w-0.5 bg-[#006C49]" />
                )}
                <span
                  className={`relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full ${
                    event.kind === "paid" || event.kind === "viewed"
                      ? "bg-[#006C49] text-white"
                      : "bg-[#E8F5EF] text-[#006C49]"
                  }`}
                >
                  <Icon size={14} weight="duotone" aria-hidden />
                </span>
              </div>
              <div className={`min-w-0 ${last ? "pb-0" : "pb-5"}`}>
                <p className="text-[14px] leading-5 font-medium text-[#111827]">{event.title}</p>
                <p className="mt-0.5 text-[12px] leading-[15px] text-[#6B7280]">{event.date}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
