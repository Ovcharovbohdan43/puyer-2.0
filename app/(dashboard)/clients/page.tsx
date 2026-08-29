import { ClientsScreen } from "@/components/dashboard/clients-screen";
import { listClients } from "@/lib/clients/persist";
import { requireSession } from "@/lib/authorization";
import { toInvoiceListRow } from "@/lib/invoices/list-view";
import { listOrganizationInvoices } from "@/lib/invoices/persist";
import { logger } from "@/lib/observability/logger";

export default async function ClientsPage() {
  const session = await requireSession();
  let clients: Array<{ id: string; name: string; email: string; address: string }> = [];
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
    }));
    invoices = invoiceRows.map((invoice) => toInvoiceListRow(invoice));
  } catch {
    logger.warn("clients_list_unavailable");
  }
  return <ClientsScreen clients={clients} invoices={invoices} />;
}
