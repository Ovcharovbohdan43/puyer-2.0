import { ReportsScreen } from "@/components/dashboard/reports-screen";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { planFromOrganization } from "@/lib/entitlements/load";
import { logger } from "@/lib/observability/logger";
import type { InvoiceListRow } from "@/lib/invoices/list-view";
import { computeWorkspaceReport } from "@/lib/reports/compute";
import { loadOrganizationReportBundle } from "@/lib/reports/load";
import { presentReport, type PresentedReport } from "@/lib/reports/present";

export default async function ReportsPage() {
  const session = await requireSession();
  let report: PresentedReport = presentReport(computeWorkspaceReport("local", [], [], "FREE"), null);
  let invoices: InvoiceListRow[] = [];
  try {
    const membership = await requireOrganization(session);
    const plan = planFromOrganization(membership.organization);
    const bundle = await loadOrganizationReportBundle(membership.organizationId, plan);
    report = presentReport(bundle.report, bundle.snapshot);
    invoices = bundle.listRows;
  } catch {
    logger.warn("reports_unavailable");
  }
  return <ReportsScreen report={report} invoices={invoices} />;
}
