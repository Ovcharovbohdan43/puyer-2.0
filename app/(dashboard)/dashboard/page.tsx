import type { Plan } from "@prisma/client";

import { OverviewScreen } from "@/components/dashboard/overview-screen";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { can } from "@/lib/entitlements";
import { planFromOrganization } from "@/lib/entitlements/load";
import { computeWorkspaceKpis, toInvoiceListRow } from "@/lib/invoices/list-view";
import type { PaymentInsight } from "@/lib/reports/compute";
import { loadOrganizationReportBundle } from "@/lib/reports/load";
import { presentReport, toWorkspaceKpis, type PresentedTrend } from "@/lib/reports/present";

export default async function DashboardPage() {
  const session = await requireSession();
  let name: string | null = null;
  let plan: Plan = "FREE";
  let recent: ReturnType<typeof toInvoiceListRow>[] = [];
  let kpis = computeWorkspaceKpis([]);
  let monthly: PresentedTrend[] = [];
  let insights: PaymentInsight | null = null;
  try {
    const membership = await requireOrganization(session);
    name = membership.user.name;
    plan = planFromOrganization(membership.organization);
    const { report, snapshot, listRows } = await loadOrganizationReportBundle(membership.organizationId, plan);
    recent = listRows.slice(0, 5);
    kpis = toWorkspaceKpis(report.base);
    const presented = presentReport(report, snapshot);
    monthly = presented.monthly;
    insights = presented.advanced?.insights ?? null;
  } catch {
    name = null;
  }

  return (
    <OverviewScreen
      name={name}
      email={session.email}
      remindersEnabled={can({ plan }, "AUTOMATIC_REMINDERS")}
      recent={recent}
      kpis={kpis}
      monthly={monthly}
      insights={insights}
    />
  );
}
