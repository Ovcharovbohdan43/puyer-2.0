import { Suspense } from "react";

import { InvoicesScreen } from "@/components/dashboard/invoices-screen";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { can } from "@/lib/entitlements";
import { planFromRow } from "@/lib/entitlements/load";
import { t } from "@/lib/i18n";
import { toInvoiceListRow } from "@/lib/invoices/list-view";
import { listOrganizationInvoices } from "@/lib/invoices/persist";
import { logger } from "@/lib/observability/logger";

function InvoicesFallback() {
  const copy = t("dashboard");
  return (
    <div className="bg-[#F6F7F6] p-10">
      <h1 className="text-[32px] leading-10 font-semibold text-[#111827]">{copy.invoicesTitle}</h1>
    </div>
  );
}

export default async function InvoicesPage() {
  const session = await requireSession();
  let rows: ReturnType<typeof toInvoiceListRow>[] = [];
  let remindersEnabled = false;
  try {
    const membership = await requireOrganization(session);
    remindersEnabled = can({ plan: planFromRow(membership.organization.subscription) }, "AUTOMATIC_REMINDERS");
    const invoices = await listOrganizationInvoices(session);
    rows = invoices.map((invoice) => toInvoiceListRow(invoice));
  } catch {
    logger.warn("invoices_list_unavailable");
  }

  return (
    <Suspense fallback={<InvoicesFallback />}>
      <InvoicesScreen invoices={rows} remindersEnabled={remindersEnabled} />
    </Suspense>
  );
}
