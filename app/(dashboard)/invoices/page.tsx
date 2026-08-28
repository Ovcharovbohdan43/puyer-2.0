import { Suspense } from "react";

import { InvoicesScreen } from "@/components/dashboard/invoices-screen";
import { requireSession } from "@/lib/authorization";
import { listOrganizationInvoices } from "@/lib/invoices/persist";
import { toInvoiceListRow } from "@/lib/invoices/list-view";
import { t } from "@/lib/i18n";

function InvoicesFallback() {
  const copy = t("dashboard");
  return (
    <div className="p-10">
      <h1 className="text-[32px] leading-10 font-semibold text-[#F8F9FF]">{copy.invoicesTitle}</h1>
    </div>
  );
}

export default async function InvoicesPage() {
  const session = await requireSession();
  const invoices = await listOrganizationInvoices(session);
  const rows = invoices.map((invoice) => toInvoiceListRow(invoice));

  return (
    <Suspense fallback={<InvoicesFallback />}>
      <InvoicesScreen invoices={rows} />
    </Suspense>
  );
}
