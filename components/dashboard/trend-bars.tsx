import type { PresentedTrend } from "@/lib/reports/present";

export function TrendBars({ points, empty }: { points: PresentedTrend[]; empty: string }) {
  if (points.length === 0 || points.every((point) => point.heightPct === 0)) {
    return (
      <div className="flex min-h-[220px] flex-1 items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-[#F9FAFB]">
        <p className="text-[14px] leading-5 text-[#6B7280]">{empty}</p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padX = 16;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const coords = points.map((point, index) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padY + innerH - (Math.max(point.heightPct, 4) / 100) * innerH;
    return { x, y, point };
  });
  const line = coords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1]!.x} ${padY + innerH} L ${coords[0]!.x} ${padY + innerH} Z`;

  return (
    <div className="flex min-h-[220px] flex-1 flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[180px] w-full" role="img">
        <path d={area} fill="#006C49" fillOpacity="0.12" />
        <path d={line} fill="none" stroke="#006C49" strokeWidth="2.5" />
        {coords.map((coord) => (
          <circle key={coord.point.period} cx={coord.x} cy={coord.y} r="4" fill="#FFFFFF" stroke="#006C49" strokeWidth="2">
            <title>{`${coord.point.label}: ${coord.point.paid}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex justify-between px-1">
        {points.map((point) => (
          <span key={point.period} className="min-w-0 flex-1 text-center text-[12px] text-[#6B7280]">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
