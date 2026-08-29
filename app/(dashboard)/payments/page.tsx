import { requireOrganization, requireSession } from "@/lib/authorization";
import { dash } from "@/lib/dashboard/chrome";
import { formatUsdLike } from "@/lib/invoices/list-view";
import { t } from "@/lib/i18n";
import { listOrganizationPayments } from "@/lib/payments/sync";

export default async function PaymentsPage() {
  const session = await requireSession();
  const membership = await requireOrganization(session);
  const payments = await listOrganizationPayments(membership.organizationId);
  const copy = t("connect");
  const dashCopy = t("dashboard");

  return (
    <main className={`${dash.page} ${dash.pagePad}`}>
      <div>
        <h1 className={dash.title}>{dashCopy.nav.payments}</h1>
        <p className={dash.subtitle}>{copy.paymentsIntro}</p>
      </div>
      {payments.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">{copy.paymentsEmpty}</p>
      ) : (
        <div className={dash.tableWrap}>
          <table className="w-full text-left text-[14px] text-[#111827]">
            <thead className={dash.tableHead}>
              <tr>
                <th className="px-4 py-3">{copy.colInvoice}</th>
                <th className="px-4 py-3">{copy.colClient}</th>
                <th className="px-4 py-3">{copy.colAmount}</th>
                <th className="px-4 py-3">{copy.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className={dash.row}>
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
