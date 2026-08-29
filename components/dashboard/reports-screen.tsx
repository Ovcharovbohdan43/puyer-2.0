import Link from "next/link";

import { TrendBars } from "@/components/dashboard/trend-bars";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import { insightMessage, type PresentedReport } from "@/lib/reports/present";

type ReportsScreenProps = {
  report: PresentedReport;
};

export function ReportsScreen({ report }: ReportsScreenProps) {
  const copy = t("reports");
  const dashCopy = t("dashboard");
  const billing = t("billing");
  const { base, advanced } = report;
  const paidShare =
    base.paidCount + base.outstandingCount === 0
      ? "0%"
      : `${((base.paidCount / (base.paidCount + base.outstandingCount)) * 100).toFixed(1)}%`;
  const outstandingShare =
    base.paidCount + base.outstandingCount === 0
      ? "0%"
      : `${((base.outstandingCount / (base.paidCount + base.outstandingCount)) * 100).toFixed(1)}%`;

  return (
    <main className={`${dash.page} ${dash.pagePad}`}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={dash.title}>{dashCopy.nav.reports}</h1>
          <p className={dash.subtitle}>{copy.intro}</p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label={copy.kpiRevenue} value={base.revenue} meta={copy.paidCount.replace("{count}", String(base.paidCount))} />
        <KpiCard label={copy.kpiPaid} value={base.paid30} meta={copy.paidShare.replace("{share}", paidShare)} good />
        <KpiCard
          label={copy.kpiOutstanding}
          value={base.outstanding}
          meta={copy.outstandingShare.replace("{share}", outstandingShare)}
          warn
        />
      </section>

      {advanced ? (
        <>
          <article className={`${dash.card} flex min-h-[380px] flex-col overflow-hidden p-0`}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.monthlyRevenue}</h2>
              <p className="text-[14px] text-[#6B7280]">{copy.last6Months}</p>
            </div>
            <TrendBars points={advanced.monthly} empty={copy.trendsEmpty} />
          </article>

          <article className={dash.tableWrap}>
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.topClients}</h2>
              <Link href="/clients" className={dash.btnOutline}>
                {copy.viewAllClients}
              </Link>
            </div>
            {advanced.clients.length === 0 ? (
              <p className="px-4 py-8 text-[14px] text-[#6B7280]">{copy.clientsEmpty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className={dash.tableHead}>
                    <tr>
                      <th className="px-4 py-3">{copy.colClient}</th>
                      <th className="px-4 py-3">{copy.colPaid}</th>
                      <th className="px-4 py-3">{copy.colOutstanding}</th>
                      <th className="px-4 py-3">{copy.colInvoices}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advanced.clients.slice(0, 5).map((row) => (
                      <tr key={row.clientId} className={dash.row}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#111827]">{row.clientName}</p>
                        </td>
                        <td className={`px-4 py-3 ${dash.paid}`}>{row.paid}</td>
                        <td className={`px-4 py-3 ${dash.outstanding}`}>{row.outstanding}</td>
                        <td className="px-4 py-3 text-[#111827]">{row.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <article className={`${dash.card} p-5`}>
              <h2 className="text-[16px] font-semibold text-[#111827]">{copy.overdueRate}</h2>
              <p className="mt-2 text-[32px] font-semibold text-[#111827]">{advanced.overdueRate}</p>
              <p className="mt-1 text-[14px] text-[#6B7280]">{copy.overdueRateHint}</p>
            </article>
            <article className={`${dash.card} p-5`}>
              <h2 className="text-[16px] font-semibold text-[#111827]">{copy.avgPayment}</h2>
              <p className="mt-2 text-[32px] font-semibold text-[#111827]">
                {advanced.avgPaymentDays ? copy.days.replace("{count}", advanced.avgPaymentDays) : copy.avgPaymentEmpty}
              </p>
              <p className="mt-1 text-[14px] text-[#6B7280]">{copy.avgPaymentHint}</p>
            </article>
            <article className={`${dash.card} p-5`}>
              <h2 className="text-[16px] font-semibold text-[#111827]">{copy.forecast}</h2>
              <p className="mt-2 text-[32px] font-semibold text-[#111827]">{advanced.forecast.amount}</p>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                {copy.forecastHint.replace("{months}", advanced.forecast.sourceLabel)}
              </p>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className={`${dash.card} p-5`}>
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.insights}</h2>
              <p className="mt-3 text-[14px] leading-5 text-[#4B5563]">
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
              paidCol={2}
            />
          </section>
        </>
      ) : (
        <article className={`${dash.card} p-5`}>
          <h2 className="text-[20px] font-semibold text-[#111827]">{copy.upgradeTitle}</h2>
          <p className="mt-2 max-w-2xl text-[14px] text-[#6B7280]">{billing.upgradeReports}</p>
          <Link href="/billing" className={`${dash.btnPrimary} mt-4 inline-flex`}>
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
  good,
  warn,
}: {
  label: string;
  value: string;
  meta: string;
  good?: boolean;
  warn?: boolean;
}) {
  return (
    <article className={dash.kpi}>
      <p className={dash.kpiLabel}>{label}</p>
      <p className={dash.kpiValue}>{value}</p>
      <p className={good ? dash.kpiMetaGood : warn ? dash.kpiMetaWarn : dash.kpiMeta}>{meta}</p>
    </article>
  );
}

function DataTable({
  title,
  empty,
  headers,
  rows,
  paidCol,
}: {
  title: string;
  empty: string;
  headers: string[];
  rows: string[][];
  paidCol?: number;
}) {
  return (
    <article className={dash.tableWrap}>
      <h2 className="border-b border-[#E5E7EB] px-4 py-4 text-[20px] font-semibold text-[#111827]">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-[14px] text-[#6B7280]">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] text-[#111827]">
            <thead className={dash.tableHead}>
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row[0]}-${index}`} className={dash.row}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className={`px-4 py-3 ${cellIndex === paidCol ? dash.paid : ""}`}>
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
