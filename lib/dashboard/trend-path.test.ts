import { describe, expect, it } from "vitest";

import { smoothTrendLine, trendAreaPath } from "@/lib/dashboard/trend-path";

describe("smoothTrendLine", () => {
  it("builds a cubic path across points", () => {
    const line = smoothTrendLine([
      { x: 0, y: 10 },
      { x: 50, y: 40 },
      { x: 100, y: 20 },
    ]);
    expect(line.startsWith("M 0.0 10.0")).toBe(true);
    expect(line).toContain(" C ");
  });
});

describe("trendAreaPath", () => {
  it("closes the fill to the chart baseline", () => {
    const points = [
      { x: 0, y: 10 },
      { x: 100, y: 20 },
    ];
    const line = smoothTrendLine(points);
    expect(trendAreaPath(line, points, 80)).toContain("L 100.0 80.0");
  });
});

describe("smoothTrendLine bounds", () => {
  it("keeps cubic handles inside the plot so a sharp dip cannot leave the card", () => {
    const line = smoothTrendLine(
      [
        { x: 0, y: 20 },
        { x: 50, y: 90 },
        { x: 100, y: 20 },
      ],
      { minY: 8, maxY: 90 },
    );
    const ys = [...line.matchAll(/[\d.]+ ([-\d.]+)/g)].map((match) => Number(match[1]));
    expect(ys.every((value) => value >= 8 && value <= 90)).toBe(true);
  });
});
