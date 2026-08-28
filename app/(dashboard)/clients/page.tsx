import { listClients } from "@/lib/clients/persist";
import { requireSession } from "@/lib/authorization";
import { ClientsScreen } from "@/components/dashboard/clients-screen";

export default async function ClientsPage() {
  const session = await requireSession();
  const clients = await listClients(session);
  return (
    <ClientsScreen
      clients={clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        address: client.address,
      }))}
    />
  );
}
