import { Suspense } from "react";

import { ClientsScreen } from "@/components/dashboard/clients-screen";
import { requireSession } from "@/lib/authorization";
import type { ClientSource } from "@/lib/clients/list-view";
import { listClients } from "@/lib/clients/persist";
import { t } from "@/lib/i18n";
import { toInvoiceListRow } from "@/lib/invoices/list-view";
import { listOrganizationInvoices } from "@/lib/invoices/persist";
import { logger } from "@/lib/observability/logger";

function ClientsFallback() {
  const copy = t("dashboard");
  return (
    <div className="bg-[#F6F7F6] p-10">
      <h1 className="text-[32px] leading-10 font-semibold text-[#111827]">{copy.nav.clients}</h1>
    </div>
  );
}

export default async function ClientsPage() {
  const session = await requireSession();
  let clients: ClientSource[] = [];
  let invoices: ReturnType<typeof toInvoiceListRow>[] = [];
  try {
    const [clientRows, invoiceRows] = await Promise.all([
      listClients(session),
      listOrganizationInvoices(session),
    ]);
    clients = clientRows.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.address,
      phone: client.phone,
      taxNumber: client.taxNumber,
      notes: client.notes,
      createdAt: client.createdAt.toISOString().slice(0, 10),
    }));
    invoices = invoiceRows.map((invoice) => toInvoiceListRow(invoice));
  } catch {
    logger.warn("clients_list_unavailable");
  }
  return (
    <Suspense fallback={<ClientsFallback />}>
      <ClientsScreen clients={clients} invoices={invoices} />
    </Suspense>
  );
}
