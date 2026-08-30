"use client";

import { dash } from "@/lib/dashboard/chrome";

type PeriodRangeFieldsProps = {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
  className?: string;
};

export function PeriodRangeFields({ from, to, fromLabel, toLabel, onFrom, onTo, className }: PeriodRangeFieldsProps) {
  return (
    <div className={`grid w-full min-w-0 grid-cols-2 gap-2 ${className ?? ""}`}>
      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-[12px] font-medium text-[#6B7280]">{fromLabel}</span>
        <input type="date" value={from} onChange={(event) => onFrom(event.target.value)} className={dash.dateInput} />
      </label>
      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-[12px] font-medium text-[#6B7280]">{toLabel}</span>
        <input type="date" value={to} onChange={(event) => onTo(event.target.value)} className={dash.dateInput} />
      </label>
    </div>
  );
}
