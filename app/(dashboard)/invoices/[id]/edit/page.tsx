import { InvoiceBuilder } from "@/components/invoice-builder/invoice-builder";
import { WorkspaceSession } from "@/components/invoice-builder/workspace-session";
import { StubScreen } from "@/components/dashboard/stub-screen";
import { requireSession } from "@/lib/authorization";
import { requireInvoiceAccess } from "@/lib/authorization/invoice";
import { listClients } from "@/lib/clients/persist";
import { invoiceToBuilderState } from "@/lib/invoices/builder-state";
import { isEditableStatus } from "@/lib/invoices/status";
import { t } from "@/lib/i18n";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const { invoice } = await requireInvoiceAccess(session, id);
  const clients = await listClients(session).catch(() => []);
  const copy = t("dashboard");

  if (!isEditableStatus(invoice.status)) {
    return (
      <StubScreen
        showPhaseLabel={false}
        title={copy.editSoonTitle}
        body={copy.editSoonBody}
        ctaHref={`/invoices?invoice=${encodeURIComponent(id)}`}
        ctaLabel={copy.backToInvoices}
      />
    );
  }

  return (
    <div className="bg-[#F6F7F6] py-8">
      <WorkspaceSession initial={invoiceToBuilderState(invoice)} invoiceId={invoice.id} publicId={invoice.publicId}>
        <InvoiceBuilder
          clients={clients.map((client) => ({
            id: client.id,
            name: client.name,
            address: client.address,
          }))}
        />
      </WorkspaceSession>
    </div>
  );
}
