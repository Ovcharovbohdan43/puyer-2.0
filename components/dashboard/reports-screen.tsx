import Link from "next/link";

import { TrendBars } from "@/components/dashboard/trend-bars";
import { t } from "@/lib/i18n";
import { insightMessage, type PresentedReport } from "@/lib/reports/present";

type ReportsScreenProps = {
  report: PresentedReport;
};

export function ReportsScreen({ report }: ReportsScreenProps) {
  const copy = t("reports");
  const dash = t("dashboard");
  const billing = t("billing");
  const { base, advanced } = report;

  return (
    <main className="flex flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-[32px] leading-10 font-semibold text-[#F8F9FF]">{dash.nav.reports}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-5 text-[#BEC6E0]">{copy.intro}</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={copy.kpiRevenue} value={base.revenue} meta={copy.paidCount.replace("{count}", String(base.paidCount))} />
        <KpiCard
          label={copy.kpiPaid}
          value={base.paid30}
          meta={copy.paid30Count.replace("{count}", String(base.paid30Count))}
        />
        <KpiCard
          label={copy.kpiOutstanding}
          value={base.outstanding}
          meta={copy.outstandingCount.replace("{count}", String(base.outstandingCount))}
        />
        <KpiCard
          label={copy.kpiOverdue}
          value={base.overdue}
          meta={copy.overdueCount.replace("{count}", String(base.overdueCount))}
          accent
        />
      </section>

      {advanced ? (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <article className="flex min-h-[320px] flex-col rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px] xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[24px] leading-8 font-bold text-white">{copy.trends}</h2>
                <p className="text-[14px] leading-5 text-[#BEC6E0]">{copy.last6Months}</p>
              </div>
              <TrendBars points={advanced.monthly} empty={copy.trendsEmpty} />
            </article>
            <div className="flex flex-col gap-4">
              <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
                <h2 className="text-[16px] leading-6 font-semibold text-white">{copy.overdueRate}</h2>
                <p className="mt-2 text-[32px] leading-10 font-bold text-[#F8F9FF]">{advanced.overdueRate}</p>
                <p className="mt-1 text-[14px] leading-5 text-[#BEC6E0]">{copy.overdueRateHint}</p>
              </article>
              <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
                <h2 className="text-[16px] leading-6 font-semibold text-white">{copy.avgPayment}</h2>
                <p className="mt-2 text-[32px] leading-10 font-bold text-[#F8F9FF]">
                  {advanced.avgPaymentDays
                    ? copy.days.replace("{count}", advanced.avgPaymentDays)
                    : copy.avgPaymentEmpty}
                </p>
                <p className="mt-1 text-[14px] leading-5 text-[#BEC6E0]">{copy.avgPaymentHint}</p>
              </article>
              <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
                <h2 className="text-[16px] leading-6 font-semibold text-white">{copy.forecast}</h2>
                <p className="mt-2 text-[32px] leading-10 font-bold text-[#F8F9FF]">{advanced.forecast.amount}</p>
                <p className="mt-1 text-[14px] leading-5 text-[#BEC6E0]">
                  {copy.forecastHint.replace("{months}", advanced.forecast.sourceLabel)}
                </p>
              </article>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DataTable
              title={copy.clients}
              empty={copy.clientsEmpty}
              headers={[copy.colClient, copy.colPaid, copy.colOutstanding, copy.colInvoices]}
              rows={advanced.clients.map((row) => [row.clientName, row.paid, row.outstanding, String(row.invoiceCount)])}
            />
            <DataTable
              title={copy.currencies}
              empty={copy.currenciesEmpty}
              headers={[copy.colCurrency, copy.colPaid, copy.colOutstanding, copy.colInvoices]}
              rows={advanced.currencies.map((row) => [row.currency, row.revenue, row.outstanding, String(row.paidCount)])}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
              <h2 className="text-[24px] leading-8 font-bold text-white">{copy.insights}</h2>
              <p className="mt-3 text-[14px] leading-5 text-[#BEC6E0]">
                {insightMessage(advanced.insights, {
                  empty: copy.insightsEmpty,
                  needBaseline: copy.insightsNeedBaseline,
                  faster: copy.insightsFaster,
                  slower: copy.insightsSlower,
                  flat: copy.insightsFlat,
                })}
              </p>
            </article>
            <DataTable
              title={copy.team}
              empty={copy.teamEmpty}
              headers={[copy.colMember, copy.colInvoices, copy.colPaid]}
              rows={advanced.team.map((row) => [row.name, String(row.invoiceCount), row.paid])}
            />
          </section>
          <p className="text-[12px] leading-4 text-[#7C839B]">
            {report.snapshotAt && report.snapshotPeriod
              ? copy.snapshotAsOf
                  .replace("{period}", report.snapshotPeriod)
                  .replace("{date}", report.snapshotAt.slice(0, 10))
              : copy.snapshotNone}
          </p>
        </>
      ) : (
        <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
          <h2 className="text-[24px] leading-8 font-bold text-white">{copy.upgradeTitle}</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-5 text-[#BEC6E0]">{billing.upgradeReports}</p>
          <Link
            href="/billing"
            className="mt-4 inline-flex rounded-lg bg-[#F8F9FF] px-4 py-2 text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#0B1C30]"
          >
            {billing.upgradeToBusiness}
          </Link>
        </article>
      )}
    </main>
  );
}

function KpiCard({
  label,
  value,
  meta,
  accent,
}: {
  label: string;
  value: string;
  meta: string;
  accent?: boolean;
}) {
  return (
    <article className={`rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px] ${accent ? "relative" : ""}`}>
      {accent ? <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#ef4444]" /> : null}
      <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{label}</p>
      <p className={`mt-2 text-[32px] leading-10 font-bold ${accent ? "text-[#ef4444]" : "text-[#F8F9FF]"}`}>{value}</p>
      <p className={`mt-1 text-[14px] leading-5 ${accent ? "text-[rgba(239,68,68,0.8)]" : "text-[#BEC6E0]"}`}>{meta}</p>
    </article>
  );
}

function DataTable({
  title,
  empty,
  headers,
  rows,
}: {
  title: string;
  empty: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E]">
      <h2 className="border-b border-[rgba(198,198,205,0.5)] px-4 py-4 text-[24px] leading-8 font-bold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-[14px] leading-5 text-[#BEC6E0]">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] text-[#F8F9FF]">
            <thead className="text-[#BEC6E0]">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row[0]}-${index}`} className="border-t border-[rgba(198,198,205,0.3)]">
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className="px-4 py-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
