import { listClients } from "@/lib/clients/persist";
import { requireSession } from "@/lib/authorization";
import { ClientsScreen } from "@/components/dashboard/clients-screen";
import { listOrganizationInvoices } from "@/lib/invoices/persist";
import { toInvoiceListRow } from "@/lib/invoices/list-view";

export default async function ClientsPage() {
  const session = await requireSession();
  const [clients, invoices] = await Promise.all([listClients(session), listOrganizationInvoices(session)]);
  return (
    <ClientsScreen
      clients={clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        address: client.address,
      }))}
      invoices={invoices.map((invoice) => toInvoiceListRow(invoice))}
    />
  );
}
