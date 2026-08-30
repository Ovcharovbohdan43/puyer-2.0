"use client";

import { dash } from "@/lib/dashboard/chrome";

type PeriodRangeFieldsProps = {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
};

export function PeriodRangeFields({ from, to, fromLabel, toLabel, onFrom, onTo }: PeriodRangeFieldsProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-[#6B7280]">{fromLabel}</span>
        <input type="date" value={from} onChange={(event) => onFrom(event.target.value)} className={dash.dateInput} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[12px] font-medium text-[#6B7280]">{toLabel}</span>
        <input type="date" value={to} onChange={(event) => onTo(event.target.value)} className={dash.dateInput} />
      </label>
    </div>
  );
}
