export type TrendPoint = { x: number; y: number };

export function smoothTrendLine(points: TrendPoint[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  }
  let path = `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]!;
    const current = points[index]!;
    const next = points[index + 1]!;
    const after = points[index + 2] ?? next;
    const c1x = current.x + (next.x - previous.x) / 6;
    const c1y = current.y + (next.y - previous.y) / 6;
    const c2x = next.x - (after.x - current.x) / 6;
    const c2y = next.y - (after.y - current.y) / 6;
    path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }
  return path;
}

export function trendAreaPath(line: string, points: TrendPoint[], bottom: number): string {
  if (points.length === 0 || !line) {
    return "";
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${line} L ${last.x.toFixed(1)} ${bottom.toFixed(1)} L ${first.x.toFixed(1)} ${bottom.toFixed(1)} Z`;
}
