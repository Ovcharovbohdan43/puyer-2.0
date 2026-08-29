"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FigmaIcon } from "@/components/marketing/figma-icon";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Modal } from "@/components/ui/modal";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import { displayFirstName, greetingPeriod, splitMoneyDisplay } from "@/lib/dashboard/greeting";
import type { InvoiceListRow, WorkspaceKpis } from "@/lib/invoices/list-view";
import { filterInvoiceRows } from "@/lib/invoices/list-view";
import type { PaymentInsight } from "@/lib/reports/compute";
import { insightMessage, type PresentedTrend } from "@/lib/reports/present";
import { TrendBars } from "@/components/dashboard/trend-bars";

type OverviewScreenProps = {
  name: string | null;
  email: string;
  remindersEnabled: boolean;
  recent: InvoiceListRow[];
  kpis: WorkspaceKpis;
  advancedReports: boolean;
  monthly: PresentedTrend[];
  insights: PaymentInsight | null;
};

function KpiMoney({ value, accent }: { value: string; accent?: boolean }) {
  const { major, cents } = splitMoneyDisplay(value);
  return (
    <p className={`flex items-end tracking-[-0.4px] ${accent ? "text-[#DC2626]" : "text-[#111827]"}`}>
      <span className="text-[32px] leading-10 font-semibold lg:text-[36px] lg:leading-[44px]">{major}</span>
      {cents ? <span className={`pb-1 text-[18px] leading-7 ${accent ? "opacity-70" : "text-[#6B7280]"}`}>{cents}</span> : null}
    </p>
  );
}

export function OverviewScreen({
  name,
  email,
  remindersEnabled,
  recent,
  kpis,
  advancedReports,
  monthly,
  insights,
}: OverviewScreenProps) {
  const copy = t("dashboard");
  const reports = t("reports");
  const billing = t("billing");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientBusy, setClientBusy] = useState(false);
  const firstName = displayFirstName(name, email, copy.fallbackName);
  const period = greetingPeriod(new Date().getHours());
  const greetingKey =
    period === "morning" ? "greetingMorning" : period === "afternoon" ? "greetingAfternoon" : "greetingEvening";
  const rows = useMemo(() => filterInvoiceRows(recent, query, "ALL"), [query, recent]);

  return (
    <div className={dash.page}>
      <header className="flex flex-col gap-4 border-b border-[#E5E7EB] bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[24px] leading-8 font-semibold text-[#111827]">{copy[greetingKey].replace("{name}", firstName)}</h1>
          <p className="text-[14px] leading-5 text-[#6B7280]">{copy.overviewSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative hidden w-[256px] sm:block">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
              <FigmaIcon src="/app/search.svg" alt="" width={14} height={14} />
            </span>
            <span className="sr-only">{copy.searchOverview}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchOverview}
              className={dash.input}
            />
          </label>
          <Link href="/invoices/new" className={dash.btnPrimary}>
            {copy.createInvoice}
          </Link>
        </div>
      </header>

      <div className="flex max-w-[1440px] flex-col gap-6 p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className={dash.kpi}>
            <div className="flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiTotalRevenue}</p>
              <span className={dash.iconMint}>
                <FigmaIcon src="/app/kpi-revenue.svg" alt="" width={15} height={9} />
              </span>
            </div>
            <KpiMoney value={kpis.revenue} />
            <p className={dash.kpiMetaGood}>{copy.kpiFromWorkspace}</p>
          </article>
          <article className={dash.kpi}>
            <div className="flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiPaid30}</p>
              <span className={dash.iconMint}>
                <FigmaIcon src="/app/kpi-paid.svg" alt="" width={15} height={15} />
              </span>
            </div>
            <KpiMoney value={kpis.paid30} />
            <p className={dash.kpiMeta}>{copy.kpiPaidCount.replace("{count}", String(kpis.paid30Count))}</p>
          </article>
          <article className={dash.kpi}>
            <div className="flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiOutstanding}</p>
              <span className={dash.iconWarn}>
                <FigmaIcon src="/app/kpi-outstanding.svg" alt="" width={15} height={15} />
              </span>
            </div>
            <KpiMoney value={kpis.outstanding} />
            <p className={dash.kpiMeta}>{copy.kpiOutstandingCount.replace("{count}", String(kpis.outstandingCount))}</p>
          </article>
          <article className={dash.kpi}>
            <div className="flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiOverdue}</p>
              <span className={dash.iconBad}>
                <FigmaIcon src="/app/kpi-overdue.svg" alt="" width={15} height={15} />
              </span>
            </div>
            <KpiMoney value={kpis.overdue} accent />
            <p className={dash.kpiMetaBad}>{copy.kpiOverdueCount.replace("{count}", String(kpis.overdueCount))}</p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className={`${dash.card} flex min-h-[320px] flex-col p-5 xl:col-span-2`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.revenueTrends}</h2>
              <p className="text-[14px] text-[#6B7280]">{copy.last6Months}</p>
            </div>
            {advancedReports ? (
              <TrendBars points={monthly} empty={reports.trendsEmpty} />
            ) : (
              <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#E5E7EB] bg-[#F9FAFB] px-4">
                <p className="text-center text-[14px] text-[#6B7280]">{reports.trendsUpgrade}</p>
                <Link href="/billing" className={dash.link}>
                  {billing.upgradeToBusiness}
                </Link>
              </div>
            )}
          </article>
          <div className="flex flex-col gap-4">
            <article className={`${dash.card} flex flex-col gap-4 p-5`}>
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.quickActions}</h2>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[#F3F4F6] px-3 py-3" onClick={() => setClientOpen(true)}>
                  <FigmaIcon src="/app/action-client.svg" alt="" width={22} height={16} />
                  <span className="text-[12px] font-semibold text-[#111827]">{copy.addClient}</span>
                </button>
                <button type="button" className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[#F3F4F6] px-3 py-3" onClick={() => setReminderOpen(true)}>
                  <FigmaIcon src="/app/action-reminder.svg" alt="" width={19} height={16} />
                  <span className="text-[12px] font-semibold text-[#111827]">{copy.reminder}</span>
                </button>
                <Link href="/settings" className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] py-3">
                  <FigmaIcon src="/app/action-stripe.svg" alt="" width={15} height={8} />
                  <span className="text-[12px] font-semibold text-[#111827]">{copy.connectStripe}</span>
                </Link>
              </div>
            </article>
            <article className={`${dash.card} flex flex-col gap-2 p-5`}>
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.insights}</h2>
              <div className="flex gap-2 rounded-lg bg-[#E8F5EF] p-3">
                <FigmaIcon src="/app/insight.svg" alt="" width={13} height={17} />
                <div className="flex flex-col gap-2">
                  <p className="text-[14px] leading-5 text-[#374151]">
                    {insights
                      ? insightMessage(insights, {
                          empty: reports.insightsEmpty,
                          needBaseline: reports.insightsNeedBaseline,
                          faster: reports.insightsFaster,
                          slower: reports.insightsSlower,
                          flat: reports.insightsFlat,
                        })
                      : reports.insightsUpgrade}
                  </p>
                  {!insights ? (
                    <Link href="/billing" className={dash.link}>
                      {billing.upgradeToBusiness}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={dash.tableWrap}>
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
            <h2 className="text-[20px] font-semibold text-[#111827]">{copy.recentInvoices}</h2>
            <Link href="/invoices" className={dash.link}>
              {copy.viewAll}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className={dash.tableHead}>
                <tr>
                  <th className="px-4 py-3">{copy.colInvoice}</th>
                  <th className="px-4 py-3">{copy.colClient}</th>
                  <th className="px-4 py-3">{copy.colDate}</th>
                  <th className="px-4 py-3 text-right">{copy.colAmount}</th>
                  <th className="px-4 py-3 text-center">{copy.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[14px] text-[#6B7280]">
                      {copy.emptyInvoices}
                    </td>
                  </tr>
                ) : (
                  rows.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={`cursor-pointer ${dash.row} hover:bg-[#F9FAFB]`}
                      tabIndex={0}
                      onClick={() => router.push(`/invoices?invoice=${encodeURIComponent(invoice.id)}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/invoices?invoice=${encodeURIComponent(invoice.id)}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3 text-[14px] font-medium text-[#111827]">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3 text-[14px] text-[#6B7280]">{invoice.clientName}</td>
                      <td className="px-4 py-3 text-[14px] text-[#6B7280]">{invoice.date}</td>
                      <td className="px-4 py-3 text-right font-mono text-[14px] text-[#111827]">{invoice.amount}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusPill status={invoice.displayStatus} variant="overview" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Modal open={clientOpen} title={copy.addClientTitle} onClose={() => setClientOpen(false)}>
        <p className="text-[14px] leading-5 text-[#45464d]">{copy.addClientBody}</p>
        <input
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder={copy.addClientName}
          className="mt-4 h-11 w-full rounded-lg border border-[#e2e8f0] px-3 text-[16px]"
        />
        <button
          type="button"
          disabled={clientBusy}
          className={`${dash.btnPrimary} mt-4 disabled:opacity-50`}
          onClick={() => {
            if (clientBusy) {
              return;
            }
            setClientBusy(true);
            void fetch("/api/clients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: clientName }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  return;
                }
                setClientName("");
                setClientOpen(false);
                router.refresh();
              })
              .finally(() => setClientBusy(false));
          }}
        >
          {copy.addClientSave}
        </button>
      </Modal>
      <Modal open={reminderOpen} title={copy.reminderTitle} onClose={() => setReminderOpen(false)}>
        <p className="text-[14px] leading-5 text-[#45464d]">
          {remindersEnabled ? copy.reminderSoon : copy.reminderUpgrade}
        </p>
        {remindersEnabled ? (
          <button type="button" className={`${dash.btnPrimary} mt-4`} onClick={() => setReminderOpen(false)}>
            {copy.addClientClose}
          </button>
        ) : (
          <Link href="/billing" className={`${dash.btnPrimary} mt-4 inline-flex`}>
            {copy.upgradeCta}
          </Link>
        )}
      </Modal>
    </div>
  );
}
