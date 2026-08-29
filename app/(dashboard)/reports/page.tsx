import { ReportsScreen } from "@/components/dashboard/reports-screen";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { planFromRow } from "@/lib/entitlements/load";
import { logger } from "@/lib/observability/logger";
import { computeWorkspaceReport } from "@/lib/reports/compute";
import { loadOrganizationReportBundle } from "@/lib/reports/load";
import { presentReport } from "@/lib/reports/present";

export default async function ReportsPage() {
  const session = await requireSession();
  try {
    const membership = await requireOrganization(session);
    const plan = planFromRow(membership.organization.subscription);
    const { report, snapshot } = await loadOrganizationReportBundle(membership.organizationId, plan);
    return <ReportsScreen report={presentReport(report, snapshot)} />;
  } catch {
    logger.warn("reports_unavailable");
    return <ReportsScreen report={presentReport(computeWorkspaceReport("local", [], [], "FREE"), null)} />;
  }
}
