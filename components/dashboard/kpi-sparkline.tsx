import { sparklinePath, type KpiSparkTone } from "@/lib/dashboard/kpi-sparkline";

const TONE: Record<KpiSparkTone, { fill: string }> = {
  good: { fill: "#006C49" },
  warn: { fill: "#C27803" },
  bad: { fill: "#DC2626" },
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
  const { area } = sparklinePath(values, width, height);
  const colors = TONE[tone];
  const fillId = `${id}-fill`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.fill} stopOpacity="0" />
          <stop offset="22%" stopColor={colors.fill} stopOpacity="0.28" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
    </svg>
  );
}
