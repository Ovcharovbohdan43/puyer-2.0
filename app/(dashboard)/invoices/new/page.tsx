import { InvoiceBuilder } from "@/components/invoice-builder/invoice-builder";
import { StubScreen } from "@/components/dashboard/stub-screen";
import { WorkspaceSession } from "@/components/invoice-builder/workspace-session";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { listClients } from "@/lib/clients/persist";
import { t } from "@/lib/i18n";
import { emptyWorkspaceBuilderState } from "@/lib/invoices/builder-state";
import { logger } from "@/lib/observability/logger";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const session = await requireSession();
  const query = await searchParams;
  try {
    const membership = await requireOrganization(session);
    const profile = membership.organization.businessProfile;
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
      <div className="bg-[#F6F7F6] py-8">
        <WorkspaceSession initial={initial}>
          <InvoiceBuilder />
        </WorkspaceSession>
      </div>
    );
  } catch {
    logger.warn("invoice_builder_unavailable");
    const copy = t("dashboard");
    return <StubScreen title={copy.pageErrorTitle} body={copy.pageErrorBody} />;
  }
}
