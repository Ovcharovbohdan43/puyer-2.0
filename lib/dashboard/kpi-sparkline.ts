import type { InvoiceListRow, WorkspaceKpis } from "@/lib/invoices/list-view";
import type { PresentedTrend } from "@/lib/reports/present";

export type KpiSparkTone = "good" | "warn" | "bad";

export type KpiSparkSpec = {
  values: number[];
  tone: KpiSparkTone;
};

function paidHeights(monthly: PresentedTrend[]): number[] {
  if (monthly.length === 0) {
    return [8, 8, 8, 8, 8, 8];
  }
  const values = monthly.map((point) => point.heightPct);
  if (values.every((value) => value === 0)) {
    return values.map((_, index) => 10 + (index % 2) * 2);
  }
  return values.map((value) => Math.max(value, 4));
}

function invertHeights(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((value) => Math.max(4, max - value + 4));
}

function slope(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  return values[values.length - 1]! - values[0]!;
}

export function kpiSparkSpecs(monthly: PresentedTrend[], kpis: WorkspaceKpis): {
  revenue: KpiSparkSpec;
  paid: KpiSparkSpec;
  outstanding: KpiSparkSpec;
  overdue: KpiSparkSpec;
} {
  const paid = paidHeights(monthly);
  const outstanding = invertHeights(paid);
  const overdue =
    kpis.overdueCount > 0
      ? outstanding.map((value, index) => value + index * 3)
      : outstanding.map((value, index) => Math.max(4, value * (1 - index / Math.max(outstanding.length, 1))));

  return {
    revenue: { values: paid, tone: slope(paid) < 0 ? "warn" : "good" },
    paid: { values: paid, tone: kpis.paid30Count === 0 ? "warn" : "good" },
    outstanding: {
      values: outstanding,
      tone: kpis.outstandingCount > 0 ? "warn" : "good",
    },
    overdue: {
      values: overdue,
      tone: kpis.overdueCount > 0 ? "bad" : "good",
    },
  };
}

export function sparkMonthlyFromInvoices(invoices: InvoiceListRow[], now = new Date()): PresentedTrend[] {
  const keys: string[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    keys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const totals = new Map(keys.map((key) => [key, 0n]));
  for (const invoice of invoices) {
    const period = invoice.date.slice(0, 7);
    if (!totals.has(period)) {
      continue;
    }
    totals.set(period, (totals.get(period) ?? 0n) + BigInt(invoice.totalMinor));
  }
  const max = keys.reduce((highest, key) => {
    const value = totals.get(key) ?? 0n;
    return value > highest ? value : highest;
  }, 0n);
  return keys.map((period) => ({
    period,
    label: period,
    paid: "0",
    heightPct: max === 0n ? 0 : Number(((totals.get(period) ?? 0n) * 100n) / max),
  }));
}

export function sparklinePath(values: number[], width: number, height: number): { line: string; area: string } {
  const padX = 0;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(...values, 1);
  const coords = values.map((value, index) => {
    const x = padX + (values.length === 1 ? innerW / 2 : (index / (values.length - 1)) * innerW);
    const y = padY + innerH - (value / max) * innerH;
    return { x, y };
  });
  const line = coords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1]!.x.toFixed(1)} ${height} L ${coords[0]!.x.toFixed(1)} ${height} Z`;
  return { line, area };
}
