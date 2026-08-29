"use client";

import { useId } from "react";

import { smoothTrendLine, trendAreaPath } from "@/lib/dashboard/trend-path";
import type { PresentedTrend } from "@/lib/reports/present";

export function TrendBars({ points, empty }: { points: PresentedTrend[]; empty: string }) {
  const gradientId = useId().replaceAll(":", "");
  const fillId = `${gradientId}-fill`;
  const strokeId = `${gradientId}-stroke`;

  if (points.length === 0 || points.every((point) => point.heightPct === 0)) {
    return (
      <div className="flex min-h-[240px] flex-1 items-center justify-center bg-[#F9FAFB]">
        <p className="px-6 text-center text-[14px] leading-5 text-[#6B7280]">{empty}</p>
      </div>
    );
  }

  const width = 960;
  const height = 360;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const coords = points.map((point, index) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padY + innerH - (Math.max(point.heightPct, 2) / 100) * innerH;
    return { x, y, point };
  });
  const line = smoothTrendLine(coords);
  const area = trendAreaPath(line, coords, height);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-h-[240px] w-full flex-1"
        preserveAspectRatio="none"
        role="img"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#006C49" stopOpacity="0.38" />
            <stop offset="42%" stopColor="#6CF8BB" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#006C49" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#004D34" />
            <stop offset="55%" stopColor="#006C49" />
            <stop offset="100%" stopColor="#6CF8BB" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${fillId})`} />
        <path d={line} fill="none" stroke={`url(#${strokeId})`} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex justify-between px-4 pb-3 pt-1">
        {points.map((point) => (
          <span key={point.period} className="min-w-0 flex-1 truncate text-center text-[12px] text-[#6B7280]" title={point.paid}>
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
