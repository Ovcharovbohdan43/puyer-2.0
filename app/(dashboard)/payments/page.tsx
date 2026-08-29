import { requireOrganization, requireSession } from "@/lib/authorization";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import { logger } from "@/lib/observability/logger";
import { toPaymentListRow } from "@/lib/payments/present";
import { listOrganizationPayments } from "@/lib/payments/sync";

export default async function PaymentsPage() {
  const session = await requireSession();
  const copy = t("connect");
  const dashCopy = t("dashboard");
  let rows: ReturnType<typeof toPaymentListRow>[] = [];
  try {
    const membership = await requireOrganization(session);
    rows = (await listOrganizationPayments(membership.organizationId)).map(toPaymentListRow);
  } catch {
    logger.warn("payments_list_unavailable");
  }

  return (
    <main className={`${dash.page} ${dash.pagePad}`}>
      <div>
        <h1 className={dash.title}>{dashCopy.nav.payments}</h1>
        <p className={dash.subtitle}>{copy.paymentsIntro}</p>
      </div>
      {rows.length === 0 ? (
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
              {rows.map((payment) => (
                <tr key={payment.id} className={dash.row}>
                  <td className="px-4 py-3">{payment.invoiceNumber}</td>
                  <td className="px-4 py-3">{payment.clientName}</td>
                  <td className="px-4 py-3">{payment.amount}</td>
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
