import { sparklinePath, type KpiSparkTone } from "@/lib/dashboard/kpi-sparkline";

const TONE: Record<KpiSparkTone, { stroke: string }> = {
  good: { stroke: "#006C49" },
  warn: { stroke: "#C27803" },
  bad: { stroke: "#DC2626" },
};

export function KpiSparkline({
  values,
  tone,
  id,
}: {
  values: number[];
  tone: KpiSparkTone;
  id: string;
}) {
  const width = 280;
  const height = 72;
  const { line, area } = sparklinePath(values, width, height);
  const colors = TONE[tone];
  const fillId = `${id}-fill`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] w-full opacity-90"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={colors.stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path d={line} fill="none" stroke={colors.stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
