import { formatUsdLike, type WorkspaceKpis } from "@/lib/invoices/list-view";
import type { BaseReport, MonthlyPoint, PaymentInsight, SnapshotMetrics, WorkspaceReport } from "@/lib/reports/compute";
import { mergeLiveMonthlyWithSnapshot, monthLabel, utcMonthKey } from "@/lib/reports/compute";

export type InsightCopy = {
  empty: string;
  needBaseline: string;
  faster: string;
  slower: string;
  flat: string;
};

export function insightMessage(insights: PaymentInsight, copy: InsightCopy): string {
  if (insights.avgDays === null) {
    return copy.empty;
  }
  if (insights.improvedDays === null) {
    return copy.needBaseline.replace("{days}", String(insights.avgDays));
  }
  if (insights.improvedDays > 0) {
    return copy.faster.replace("{days}", String(insights.avgDays)).replace("{improved}", String(insights.improvedDays));
  }
  if (insights.improvedDays < 0) {
    return copy.slower.replace("{days}", String(insights.avgDays)).replace("{worse}", String(Math.abs(insights.improvedDays)));
  }
  return copy.flat.replace("{days}", String(insights.avgDays));
}

export type PresentedBase = {
  currency: string;
  revenue: string;
  paidCount: number;
  paid30: string;
  paid30Count: number;
  outstanding: string;
  outstandingCount: number;
  overdue: string;
  overdueCount: number;
};

export type PresentedTrend = {
  period: string;
  label: string;
  paid: string;
  heightPct: number;
};

export type PresentedReport = {
  organizationId: string;
  snapshotAt: string | null;
  snapshotPeriod: string | null;
  base: PresentedBase;
  monthly: PresentedTrend[];
  advanced: {
    monthly: PresentedTrend[];
    overdueRate: string;
    avgPaymentDays: string | null;
    clients: Array<{
      clientId: string;
      clientName: string;
      paid: string;
      outstanding: string;
      invoiceCount: number;
    }>;
    currencies: Array<{
      currency: string;
      revenue: string;
      outstanding: string;
      paidCount: number;
    }>;
    forecast: { amount: string; sourceLabel: string };
    insights: { avgDays: number | null; previousAvgDays: number | null; improvedDays: number | null };
    team: Array<{ userId: string | null; name: string; invoiceCount: number; paid: string }>;
  } | null;
};

export function presentBase(base: BaseReport): PresentedBase {
  return {
    currency: base.currency,
    revenue: formatUsdLike(base.revenueMinor, base.currency),
    paidCount: base.paidCount,
    paid30: formatUsdLike(base.paidLast30Minor, base.currency),
    paid30Count: base.paidLast30Count,
    outstanding: formatUsdLike(base.outstandingMinor, base.currency),
    outstandingCount: base.outstandingCount,
    overdue: formatUsdLike(base.overdueMinor, base.currency),
    overdueCount: base.overdueCount,
  };
}

export function presentTrends(monthly: MonthlyPoint[]): PresentedTrend[] {
  const max = monthly.reduce((highest, row) => (row.paidMinor > highest ? row.paidMinor : highest), 0n);
  return monthly.map((row) => ({
    period: row.period,
    label: monthLabel(row.period),
    paid: formatUsdLike(row.paidMinor, row.currency),
    heightPct: max === 0n ? 0 : Number((row.paidMinor * 100n) / max),
  }));
}

export function presentReport(
  report: WorkspaceReport,
  snapshot: SnapshotMetrics | null = null,
  now = new Date(),
): PresentedReport {
  const base = presentBase(report.base);
  const snapshotAt = snapshot?.generatedAt ?? null;
  const snapshotPeriod = snapshot?.period ?? null;
  const monthly = presentTrends(mergeLiveMonthlyWithSnapshot(report.monthly, snapshot, utcMonthKey(now)));
  if (!report.advanced) {
    return { organizationId: report.organizationId, snapshotAt, snapshotPeriod, base, monthly, advanced: null };
  }
  const advanced = {
    ...report.advanced,
    monthly: mergeLiveMonthlyWithSnapshot(report.advanced.monthly, snapshot, utcMonthKey(now)),
  };
  const overduePct = Math.round(advanced.overdueRate * 1000) / 10;
  return {
    organizationId: report.organizationId,
    snapshotAt,
    snapshotPeriod,
    base,
    monthly,
    advanced: {
      monthly: presentTrends(advanced.monthly),
      overdueRate: `${overduePct}%`,
      avgPaymentDays: advanced.avgPaymentDays === null ? null : String(advanced.avgPaymentDays),
      clients: advanced.clients.map((row) => ({
        clientId: row.clientId,
        clientName: row.clientName,
        paid: formatUsdLike(row.paidMinor, row.currency),
        outstanding: formatUsdLike(row.outstandingMinor, row.currency),
        invoiceCount: row.invoiceCount,
      })),
      currencies: advanced.currencies.map((row) => ({
        currency: row.currency,
        revenue: formatUsdLike(row.revenueMinor, row.currency),
        outstanding: formatUsdLike(row.outstandingMinor, row.currency),
        paidCount: row.paidCount,
      })),
      forecast: {
        amount: formatUsdLike(advanced.forecast.nextMonthPaidMinor, advanced.forecast.currency),
        sourceLabel: advanced.forecast.sourcePeriods.map((period) => monthLabel(period)).join(", "),
      },
      insights: advanced.insights,
      team: advanced.team.map((row) => ({
        userId: row.userId,
        name: row.name,
        invoiceCount: row.invoiceCount,
        paid: formatUsdLike(row.paidMinor, row.currency),
      })),
    },
  };
}

export function toWorkspaceKpis(base: BaseReport): WorkspaceKpis {
  const presented = presentBase(base);
  return {
    currency: presented.currency,
    revenue: presented.revenue,
    paidCount: presented.paidCount,
    paid30: presented.paid30,
    paid30Count: presented.paid30Count,
    outstanding: presented.outstanding,
    outstandingCount: presented.outstandingCount,
    overdue: presented.overdue,
    overdueCount: presented.overdueCount,
  };
}
