import { requireOrganization, requireSession } from "@/lib/authorization";
import { formatUsdLike } from "@/lib/invoices/list-view";
import { t } from "@/lib/i18n";
import { listOrganizationPayments } from "@/lib/payments/sync";

export default async function PaymentsPage() {
  const session = await requireSession();
  const membership = await requireOrganization(session);
  const payments = await listOrganizationPayments(membership.organizationId);
  const copy = t("connect");
  const dash = t("dashboard");

  return (
    <main className="flex flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-[32px] leading-10 font-semibold text-[#F8F9FF]">{dash.nav.payments}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-5 text-[#BEC6E0]">{copy.paymentsIntro}</p>
      </div>
      {payments.length === 0 ? (
        <p className="text-[14px] text-[#BEC6E0]">{copy.paymentsEmpty}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[rgba(198,198,205,0.5)]">
          <table className="w-full text-left text-[12px] text-[#F8F9FF]">
            <thead className="bg-[#131B2E] text-[#BEC6E0]">
              <tr>
                <th className="px-4 py-3 font-semibold">{copy.colInvoice}</th>
                <th className="px-4 py-3 font-semibold">{copy.colClient}</th>
                <th className="px-4 py-3 font-semibold">{copy.colAmount}</th>
                <th className="px-4 py-3 font-semibold">{copy.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-t border-[rgba(198,198,205,0.3)] bg-[#0B1320]">
                  <td className="px-4 py-3">{payment.invoice.invoiceNumber}</td>
                  <td className="px-4 py-3">{payment.invoice.clientName}</td>
                  <td className="px-4 py-3">{formatUsdLike(payment.amountMinor, payment.currency)}</td>
                  <td className="px-4 py-3">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
