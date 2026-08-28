import "server-only";

import type { Plan, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";
import { toInvoiceListRow, type InvoiceListRow } from "@/lib/invoices/list-view";
import {
  computeFullReport,
  computeWorkspaceReport,
  parseSnapshotMetrics,
  toSnapshotMetrics,
  utcMonthKey,
  type ReportInvoice,
  type ReportPayment,
  type SnapshotMetrics,
  type WorkspaceReport,
} from "@/lib/reports/compute";

async function loadReportInvoices(organizationId: string): Promise<ReportInvoice[]> {
  const rows = await prisma.invoice.findMany({
    where: { organizationId },
    select: {
      id: true,
      organizationId: true,
      clientId: true,
      clientName: true,
      createdByUserId: true,
      currency: true,
      status: true,
      issueDate: true,
      dueDate: true,
      sentAt: true,
      totalMinor: true,
      createdBy: { select: { name: true, email: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    clientId: row.clientId,
    clientName: row.clientName,
    createdByUserId: row.createdByUserId,
    creatorName: row.createdBy?.name?.trim() || row.createdBy?.email || null,
    currency: row.currency,
    status: row.status,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    sentAt: row.sentAt,
    totalMinor: row.totalMinor,
  }));
}

async function loadReportPayments(organizationId: string): Promise<ReportPayment[]> {
  return prisma.invoicePayment.findMany({
    where: { organizationId, status: "SUCCEEDED" },
    select: {
      organizationId: true,
      invoiceId: true,
      amountMinor: true,
      currency: true,
      status: true,
      paidAt: true,
    },
  });
}

export async function loadLatestSnapshot(organizationId: string): Promise<SnapshotMetrics | null> {
  const row = await prisma.reportSnapshot.findFirst({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
  });
  return parseSnapshotMetrics(row?.metrics);
}

export async function loadOrganizationReportBundle(
  organizationId: string,
  plan: Plan,
  now = new Date(),
): Promise<{
  report: WorkspaceReport;
  snapshot: SnapshotMetrics | null;
  listRows: InvoiceListRow[];
}> {
  const rows = await prisma.invoice.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } } },
  });
  const payments = await loadReportPayments(organizationId);
  const invoices: ReportInvoice[] = rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    clientId: row.clientId,
    clientName: row.clientName,
    createdByUserId: row.createdByUserId,
    creatorName: row.createdBy?.name?.trim() || row.createdBy?.email || null,
    currency: row.currency,
    status: row.status,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    sentAt: row.sentAt,
    totalMinor: row.totalMinor,
  }));
  return {
    report: computeWorkspaceReport(organizationId, invoices, payments, plan, now),
    snapshot: await loadLatestSnapshot(organizationId),
    listRows: rows.map((row) => toInvoiceListRow(row, now)),
  };
}

export async function loadOrganizationReport(organizationId: string, plan: Plan, now = new Date()) {
  const bundle = await loadOrganizationReportBundle(organizationId, plan, now);
  return bundle.report;
}

export async function listOrganizationIdsForSnapshots(): Promise<string[]> {
  const rows = await prisma.organization.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

export async function snapshotOrganizationMonth(organizationId: string, now = new Date()) {
  const invoices = await loadReportInvoices(organizationId);
  const payments = await loadReportPayments(organizationId);
  const full = computeFullReport(organizationId, invoices, payments, now);
  const metrics = toSnapshotMetrics(full, now);
  const period = utcMonthKey(now);
  const json = JSON.parse(JSON.stringify(metrics)) as Prisma.InputJsonValue;
  await prisma.reportSnapshot.upsert({
    where: { organizationId_period: { organizationId, period } },
    create: {
      organizationId,
      period,
      metrics: json,
    },
    update: {
      metrics: json,
    },
  });
  logger.info("report snapshot written", { organizationId, period });
  return { organizationId, period };
}
