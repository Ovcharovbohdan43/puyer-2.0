import type { InvoicePaymentStatus, InvoiceStatus, Plan } from "@prisma/client";

import { can } from "@/lib/entitlements";
import { displayInvoiceStatus } from "@/lib/invoices/status";

export type ReportInvoice = {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  createdByUserId: string | null;
  creatorName: string | null;
  currency: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  sentAt: Date | null;
  totalMinor: bigint;
};

export type ReportPayment = {
  organizationId: string;
  invoiceId: string;
  amountMinor: bigint;
  currency: string;
  status: InvoicePaymentStatus;
  paidAt: Date | null;
};

export type BaseReport = {
  currency: string;
  revenueMinor: bigint;
  paidCount: number;
  paidLast30Minor: bigint;
  paidLast30Count: number;
  outstandingMinor: bigint;
  outstandingCount: number;
  overdueMinor: bigint;
  overdueCount: number;
};

export type MonthlyPoint = {
  period: string;
  paidMinor: bigint;
  currency: string;
};

export type ClientPerformance = {
  clientId: string;
  clientName: string;
  currency: string;
  paidMinor: bigint;
  outstandingMinor: bigint;
  invoiceCount: number;
};

export type CurrencyBreakdown = {
  currency: string;
  revenueMinor: bigint;
  outstandingMinor: bigint;
  paidCount: number;
};

export type Forecast = {
  currency: string;
  nextMonthPaidMinor: bigint;
  sourcePeriods: string[];
};

export type PaymentInsight = {
  avgDays: number | null;
  previousAvgDays: number | null;
  improvedDays: number | null;
};

export type TeamContributor = {
  userId: string | null;
  name: string;
  invoiceCount: number;
  paidMinor: bigint;
  currency: string;
};

export type AdvancedReport = {
  monthly: MonthlyPoint[];
  overdueRate: number;
  avgPaymentDays: number | null;
  clients: ClientPerformance[];
  currencies: CurrencyBreakdown[];
  forecast: Forecast;
  insights: PaymentInsight;
  team: TeamContributor[];
};

export type WorkspaceReport = {
  organizationId: string;
  base: BaseReport;
  monthly: MonthlyPoint[];
  advanced: AdvancedReport | null;
};

const MS_PER_DAY = 86_400_000;
const OUTSTANDING: ReadonlySet<InvoiceStatus> = new Set([
  "OVERDUE",
  "READY",
  "SENT",
  "VIEWED",
  "PARTIALLY_PAID",
]);

export function utcMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addUtcMonths(date: Date, delta: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));
}

export function lastNMonthKeys(now: Date, count: number): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(utcMonthKey(addUtcMonths(now, -i)));
  }
  return keys;
}

export function completeMonthKeys(now: Date, count: number): string[] {
  const keys: string[] = [];
  for (let i = count; i >= 1; i -= 1) {
    keys.push(utcMonthKey(addUtcMonths(now, -i)));
  }
  return keys;
}

export function monthLabel(period: string): string {
  const [yearRaw, monthRaw] = period.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!year || !month) {
    return period;
  }
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

export function scopeToOrganization<T extends { organizationId: string }>(
  rows: readonly T[],
  organizationId: string,
): T[] {
  return rows.filter((row) => row.organizationId === organizationId);
}

function mostFrequentCurrency(invoices: readonly ReportInvoice[]): string {
  const counts = new Map<string, number>();
  for (const invoice of invoices) {
    counts.set(invoice.currency, (counts.get(invoice.currency) ?? 0) + 1);
  }
  let best = "USD";
  let bestCount = -1;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}

function displayOf(invoice: ReportInvoice, now: Date): InvoiceStatus {
  return displayInvoiceStatus(invoice.status, invoice.dueDate, now);
}

function firstSucceededPayment(
  invoiceId: string,
  payments: readonly ReportPayment[],
): ReportPayment | null {
  let earliest: ReportPayment | null = null;
  for (const payment of payments) {
    if (payment.invoiceId !== invoiceId || payment.status !== "SUCCEEDED" || !payment.paidAt) {
      continue;
    }
    if (!earliest || (earliest.paidAt && payment.paidAt < earliest.paidAt)) {
      earliest = payment;
    }
  }
  return earliest;
}

function recognizedPaidAt(invoice: ReportInvoice, payments: readonly ReportPayment[]): Date {
  return firstSucceededPayment(invoice.id, payments)?.paidAt ?? invoice.sentAt ?? invoice.issueDate;
}

function isWithinLastDays(date: Date, now: Date, days: number): boolean {
  const delta = now.getTime() - date.getTime();
  return delta >= 0 && delta <= days * MS_PER_DAY;
}

function paymentDays(invoice: ReportInvoice, paidAt: Date): number | null {
  const start = invoice.sentAt ?? invoice.issueDate;
  const days = Math.floor((paidAt.getTime() - start.getTime()) / MS_PER_DAY);
  return days < 0 ? null : days;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function computeBaseReport(
  invoices: readonly ReportInvoice[],
  payments: readonly ReportPayment[] = [],
  now = new Date(),
): BaseReport {
  const currency = mostFrequentCurrency(invoices);
  const scoped = invoices.filter((invoice) => invoice.currency === currency);
  let revenueMinor = 0n;
  let outstandingMinor = 0n;
  let overdueMinor = 0n;
  let paidLast30Minor = 0n;
  let paidCount = 0;
  let outstandingCount = 0;
  let overdueCount = 0;
  let paidLast30Count = 0;
  for (const invoice of scoped) {
    const display = displayOf(invoice, now);
    if (display === "PAID") {
      revenueMinor += invoice.totalMinor;
      paidCount += 1;
      if (isWithinLastDays(recognizedPaidAt(invoice, payments), now, 30)) {
        paidLast30Minor += invoice.totalMinor;
        paidLast30Count += 1;
      }
    }
    if (OUTSTANDING.has(display)) {
      outstandingMinor += invoice.totalMinor;
      outstandingCount += 1;
    }
    if (display === "OVERDUE") {
      overdueMinor += invoice.totalMinor;
      overdueCount += 1;
    }
  }
  return {
    currency,
    revenueMinor,
    paidCount,
    paidLast30Minor,
    paidLast30Count,
    outstandingMinor,
    outstandingCount,
    overdueMinor,
    overdueCount,
  };
}

export function computeAdvancedReport(
  invoices: readonly ReportInvoice[],
  payments: readonly ReportPayment[],
  dominantCurrency: string,
  now = new Date(),
): AdvancedReport {
  const monthKeys = lastNMonthKeys(now, 6);
  const paidByMonth = new Map<string, bigint>(monthKeys.map((key) => [key, 0n]));
  for (const invoice of invoices) {
    if (invoice.currency !== dominantCurrency) {
      continue;
    }
    if (displayOf(invoice, now) !== "PAID") {
      continue;
    }
    const when = recognizedPaidAt(invoice, payments);
    const key = utcMonthKey(when);
    if (paidByMonth.has(key)) {
      paidByMonth.set(key, (paidByMonth.get(key) ?? 0n) + invoice.totalMinor);
    }
  }
  const monthly: MonthlyPoint[] = monthKeys.map((period) => ({
    period,
    paidMinor: paidByMonth.get(period) ?? 0n,
    currency: dominantCurrency,
  }));

  let issued = 0;
  let overdue = 0;
  for (const invoice of invoices) {
    if (invoice.status === "DRAFT" || invoice.status === "CANCELED") {
      continue;
    }
    issued += 1;
    if (displayOf(invoice, now) === "OVERDUE") {
      overdue += 1;
    }
  }
  const overdueRate = issued === 0 ? 0 : overdue / issued;

  const allPaymentDays: number[] = [];
  for (const invoice of invoices) {
    const payment = firstSucceededPayment(invoice.id, payments);
    if (!payment?.paidAt) {
      continue;
    }
    const days = paymentDays(invoice, payment.paidAt);
    if (days !== null) {
      allPaymentDays.push(days);
    }
  }

  const clients = clientPerformance(invoices, dominantCurrency, now);
  const currencies = currencyBreakdown(invoices, now);
  const sourcePeriods = completeMonthKeys(now, 3);
  const sourceSum = sourcePeriods.reduce((sum, period) => {
    const point = monthly.find((row) => row.period === period);
    return sum + (point?.paidMinor ?? 0n);
  }, 0n);
  const nextMonthPaidMinor = sourceSum / 3n;

  const thisPeriod = utcMonthKey(now);
  const previousPeriod = utcMonthKey(addUtcMonths(now, -1));
  const avgDays = average(paymentDaysInMonth(invoices, payments, thisPeriod));
  const previousAvgDays = average(paymentDaysInMonth(invoices, payments, previousPeriod));
  const improvedDays =
    avgDays === null || previousAvgDays === null ? null : previousAvgDays - avgDays;

  return {
    monthly,
    overdueRate,
    avgPaymentDays: average(allPaymentDays),
    clients,
    currencies,
    forecast: {
      currency: dominantCurrency,
      nextMonthPaidMinor,
      sourcePeriods,
    },
    insights: { avgDays, previousAvgDays, improvedDays },
    team: teamContributors(invoices, dominantCurrency, now),
  };
}

function paymentDaysInMonth(
  invoices: readonly ReportInvoice[],
  payments: readonly ReportPayment[],
  period: string,
): number[] {
  const days: number[] = [];
  for (const invoice of invoices) {
    const payment = firstSucceededPayment(invoice.id, payments);
    if (!payment?.paidAt || utcMonthKey(payment.paidAt) !== period) {
      continue;
    }
    const value = paymentDays(invoice, payment.paidAt);
    if (value !== null) {
      days.push(value);
    }
  }
  return days;
}

function clientPerformance(
  invoices: readonly ReportInvoice[],
  currency: string,
  now: Date,
): ClientPerformance[] {
  const byClient = new Map<string, ClientPerformance>();
  for (const invoice of invoices) {
    if (invoice.currency !== currency) {
      continue;
    }
    const display = displayOf(invoice, now);
    const current = byClient.get(invoice.clientId) ?? {
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      currency,
      paidMinor: 0n,
      outstandingMinor: 0n,
      invoiceCount: 0,
    };
    current.invoiceCount += 1;
    if (display === "PAID") {
      current.paidMinor += invoice.totalMinor;
    }
    if (OUTSTANDING.has(display)) {
      current.outstandingMinor += invoice.totalMinor;
    }
    byClient.set(invoice.clientId, current);
  }
  return [...byClient.values()].sort((a, b) => {
    if (a.paidMinor === b.paidMinor) {
      return a.clientName.localeCompare(b.clientName);
    }
    return a.paidMinor > b.paidMinor ? -1 : 1;
  });
}

function currencyBreakdown(invoices: readonly ReportInvoice[], now: Date): CurrencyBreakdown[] {
  const byCurrency = new Map<string, CurrencyBreakdown>();
  for (const invoice of invoices) {
    const display = displayOf(invoice, now);
    const current = byCurrency.get(invoice.currency) ?? {
      currency: invoice.currency,
      revenueMinor: 0n,
      outstandingMinor: 0n,
      paidCount: 0,
    };
    if (display === "PAID") {
      current.revenueMinor += invoice.totalMinor;
      current.paidCount += 1;
    }
    if (OUTSTANDING.has(display)) {
      current.outstandingMinor += invoice.totalMinor;
    }
    byCurrency.set(invoice.currency, current);
  }
  return [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

function teamContributors(
  invoices: readonly ReportInvoice[],
  currency: string,
  now: Date,
): TeamContributor[] {
  const byUser = new Map<string, TeamContributor>();
  for (const invoice of invoices) {
    if (invoice.currency !== currency) {
      continue;
    }
    const key = invoice.createdByUserId ?? "workspace";
    const current = byUser.get(key) ?? {
      userId: invoice.createdByUserId,
      name: invoice.creatorName?.trim() || "Owner",
      invoiceCount: 0,
      paidMinor: 0n,
      currency,
    };
    current.invoiceCount += 1;
    if (displayOf(invoice, now) === "PAID") {
      current.paidMinor += invoice.totalMinor;
    }
    byUser.set(key, current);
  }
  return [...byUser.values()].sort((a, b) => b.invoiceCount - a.invoiceCount);
}

export function computeWorkspaceReport(
  organizationId: string,
  invoices: readonly ReportInvoice[],
  payments: readonly ReportPayment[],
  plan: Plan,
  now = new Date(),
): WorkspaceReport {
  const scopedInvoices = scopeToOrganization(invoices, organizationId);
  const scopedPayments = scopeToOrganization(payments, organizationId);
  const base = computeBaseReport(scopedInvoices, scopedPayments, now);
  const advanced = computeAdvancedReport(scopedInvoices, scopedPayments, base.currency, now);
  return {
    organizationId,
    base,
    monthly: advanced.monthly,
    advanced: can({ plan }, "ADVANCED_REPORTS") ? advanced : null,
  };
}

export function computeFullReport(
  organizationId: string,
  invoices: readonly ReportInvoice[],
  payments: readonly ReportPayment[],
  now = new Date(),
): { organizationId: string; base: BaseReport; monthly: MonthlyPoint[]; advanced: AdvancedReport } {
  const scopedInvoices = scopeToOrganization(invoices, organizationId);
  const scopedPayments = scopeToOrganization(payments, organizationId);
  const base = computeBaseReport(scopedInvoices, scopedPayments, now);
  const advanced = computeAdvancedReport(scopedInvoices, scopedPayments, base.currency, now);
  return {
    organizationId,
    base,
    monthly: advanced.monthly,
    advanced,
  };
}

export type SnapshotMetrics = {
  version: 1;
  period: string;
  generatedAt: string;
  currency: string;
  base: {
    revenueMinor: string;
    paidCount: number;
    paidLast30Minor: string;
    paidLast30Count: number;
    outstandingMinor: string;
    outstandingCount: number;
    overdueMinor: string;
    overdueCount: number;
  };
  monthly: Array<{ period: string; paidMinor: string; currency: string }>;
  overdueRate: number;
  avgPaymentDays: number | null;
  clients: Array<{
    clientId: string;
    clientName: string;
    currency: string;
    paidMinor: string;
    outstandingMinor: string;
    invoiceCount: number;
  }>;
  currencies: Array<{
    currency: string;
    revenueMinor: string;
    outstandingMinor: string;
    paidCount: number;
  }>;
  forecast: { currency: string; nextMonthPaidMinor: string; sourcePeriods: string[] };
  insights: PaymentInsight;
  team: Array<{
    userId: string | null;
    name: string;
    invoiceCount: number;
    paidMinor: string;
    currency: string;
  }>;
};

export function toSnapshotMetrics(
  report: { base: BaseReport; advanced: AdvancedReport },
  now = new Date(),
): SnapshotMetrics {
  const { base, advanced } = report;
  return {
    version: 1,
    period: utcMonthKey(now),
    generatedAt: now.toISOString(),
    currency: base.currency,
    base: {
      revenueMinor: base.revenueMinor.toString(),
      paidCount: base.paidCount,
      paidLast30Minor: base.paidLast30Minor.toString(),
      paidLast30Count: base.paidLast30Count,
      outstandingMinor: base.outstandingMinor.toString(),
      outstandingCount: base.outstandingCount,
      overdueMinor: base.overdueMinor.toString(),
      overdueCount: base.overdueCount,
    },
    monthly: advanced.monthly.map((row) => ({
      period: row.period,
      paidMinor: row.paidMinor.toString(),
      currency: row.currency,
    })),
    overdueRate: advanced.overdueRate,
    avgPaymentDays: advanced.avgPaymentDays,
    clients: advanced.clients.map((row) => ({
      ...row,
      paidMinor: row.paidMinor.toString(),
      outstandingMinor: row.outstandingMinor.toString(),
    })),
    currencies: advanced.currencies.map((row) => ({
      ...row,
      revenueMinor: row.revenueMinor.toString(),
      outstandingMinor: row.outstandingMinor.toString(),
    })),
    forecast: {
      currency: advanced.forecast.currency,
      nextMonthPaidMinor: advanced.forecast.nextMonthPaidMinor.toString(),
      sourcePeriods: advanced.forecast.sourcePeriods,
    },
    insights: advanced.insights,
    team: advanced.team.map((row) => ({
      ...row,
      paidMinor: row.paidMinor.toString(),
    })),
  };
}

export function parseSnapshotMetrics(value: unknown): SnapshotMetrics | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Partial<SnapshotMetrics> & { monthly?: unknown; version?: unknown };
  if (row.version !== 1 || typeof row.period !== "string" || typeof row.generatedAt !== "string") {
    return null;
  }
  if (!Array.isArray(row.monthly)) {
    return null;
  }
  const monthly = row.monthly.filter(
    (point): point is { period: string; paidMinor: string; currency: string } =>
      Boolean(
        point &&
          typeof point === "object" &&
          typeof (point as { period?: unknown }).period === "string" &&
          typeof (point as { paidMinor?: unknown }).paidMinor === "string" &&
          typeof (point as { currency?: unknown }).currency === "string",
      ),
  );
  return { ...(row as SnapshotMetrics), monthly };
}

export function mergeLiveMonthlyWithSnapshot(
  live: MonthlyPoint[],
  snapshot: SnapshotMetrics | null,
  currentPeriod: string,
): MonthlyPoint[] {
  if (!snapshot) {
    return live;
  }
  const fromSnap = new Map(snapshot.monthly.map((point) => [point.period, BigInt(point.paidMinor)]));
  return live.map((point) => {
    if (point.period === currentPeriod) {
      return point;
    }
    const paidMinor = fromSnap.get(point.period);
    if (paidMinor === undefined) {
      return point;
    }
    return { ...point, paidMinor };
  });
}
