import type { PresentedTrend } from "@/lib/reports/present";

export function TrendBars({ points, empty }: { points: PresentedTrend[]; empty: string }) {
  if (points.length === 0 || points.every((point) => point.heightPct === 0)) {
    return (
      <div className="flex min-h-[220px] flex-1 items-center justify-center rounded border border-dashed border-[rgba(198,198,205,0.3)] bg-[rgba(63,70,92,0.2)]">
        <p className="text-[14px] leading-5 text-[#BEC6E0]">{empty}</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-[220px] flex-1 items-end gap-2 px-1">
      {points.map((point) => (
        <div key={point.period} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-[180px] w-full items-end">
            <div
              className="w-full rounded-t bg-[#6FFBBE]"
              style={{ height: `${Math.max(point.heightPct, point.heightPct === 0 ? 0 : 6)}%` }}
              title={`${point.label}: ${point.paid}`}
            />
          </div>
          <span className="text-[12px] leading-4 text-[#BEC6E0]">{point.label}</span>
        </div>
      ))}
    </div>
  );
}
