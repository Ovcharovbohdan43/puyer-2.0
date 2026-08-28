import { InvoiceBuilder } from "@/components/invoice-builder/invoice-builder";
import { WorkspaceSession } from "@/components/invoice-builder/workspace-session";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { emptyWorkspaceBuilderState } from "@/lib/invoices/builder-state";
import { listClients } from "@/lib/clients/persist";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const session = await requireSession();
  const membership = await requireOrganization(session);
  const profile = membership.organization.businessProfile;
  const query = await searchParams;
  const clients = await listClients(session);
  const presetClient = clients.find((client) => client.id === query.client);

  const initial = emptyWorkspaceBuilderState({
    businessName: profile?.businessName || membership.user.name || session.email,
    businessAddress: profile?.businessAddress || "",
    currency: profile?.defaultCurrency || "USD",
    taxRate: profile?.defaultTaxRate || "0",
    clientName: presetClient?.name,
  });
  if (presetClient?.address) {
    initial.clientAddress = presetClient.address;
  }

  return (
    <div className="bg-[#0B1320] py-8">
      <WorkspaceSession initial={initial}>
        <InvoiceBuilder />
      </WorkspaceSession>
    </div>
  );
}
