"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FigmaIcon } from "@/components/marketing/figma-icon";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Modal } from "@/components/ui/modal";
import { useTheme } from "@/components/ui/theme";
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
    <p className={`flex items-end tracking-[-0.96px] ${accent ? "text-[#ef4444]" : "text-[#F8F9FF]"}`}>
      <span className="text-[32px] leading-10 font-bold lg:text-[48px] lg:leading-[56px]">{major}</span>
      {cents ? (
        <span className={`pb-1 text-[20px] leading-7 ${accent ? "opacity-70" : "text-[#BEC6E0]"}`}>{cents}</span>
      ) : null}
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
  const { toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientBusy, setClientBusy] = useState(false);
  const firstName = displayFirstName(name, email, copy.fallbackName);
  const period = greetingPeriod(new Date().getHours());
  const greetingKey =
    period === "morning"
      ? "greetingMorning"
      : period === "afternoon"
        ? "greetingAfternoon"
        : "greetingEvening";
  const rows = useMemo(() => filterInvoiceRows(recent, query, "ALL"), [query, recent]);

  return (
    <div className="min-h-dvh bg-[#0B1320]">
      <header className="flex flex-col gap-4 border-b border-[rgba(198,198,205,0.3)] bg-[rgba(19,27,46,0.8)] px-6 py-4 backdrop-blur-[6px] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[24px] leading-8 font-bold text-white">{copy[greetingKey].replace("{name}", firstName)}</h1>
          <p className="text-[14px] leading-5 text-[#BEC6E0]">{copy.overviewSubtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="relative hidden w-[256px] sm:block">
            <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2">
              <FigmaIcon src="/app/search.svg" alt="" width={14} height={14} />
            </span>
            <span className="sr-only">{copy.searchOverview}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchOverview}
              className="h-[38px] w-full rounded-lg border border-[#C6C6CD] bg-[#131B2E] py-1.5 pr-2 pl-8 text-[14px] text-[#F8F9FF] outline-none placeholder:text-[#6B7280]"
            />
          </label>
          <button type="button" className="rounded-full p-1" aria-label={copy.themeToggle} onClick={toggle}>
            <FigmaIcon src="/app/theme.svg" alt="" width={18} height={18} />
          </button>
          <Link
            href="/invoices/new"
            className="rounded-lg bg-[#F8F9FF] px-4 py-1 text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#0B1C30]"
          >
            {copy.createInvoice}
          </Link>
        </div>
      </header>

      <div className="flex max-w-[1440px] flex-col gap-6 p-6">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="relative overflow-hidden rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
            <div className="flex items-start justify-between">
              <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.kpiTotalRevenue}</p>
              <FigmaIcon src="/app/kpi-revenue.svg" alt="" width={15} height={9} />
            </div>
            <KpiMoney value={kpis.revenue} />
            <p className="mt-1 flex items-center gap-1 text-[14px] leading-5 text-[#4EDEA3]">
              <FigmaIcon src="/app/kpi-up.svg" alt="" width={9} height={9} />
              {copy.kpiFromWorkspace}
            </p>
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t from-[rgba(111,251,190,0.3)] to-transparent opacity-20" />
          </article>
          <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
            <div className="flex items-start justify-between">
              <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.kpiPaid30}</p>
              <FigmaIcon src="/app/kpi-paid.svg" alt="" width={15} height={15} />
            </div>
            <KpiMoney value={kpis.paid30} />
            <p className="mt-1 text-[14px] leading-5 text-[#BEC6E0]">
              {copy.kpiPaidCount.replace("{count}", String(kpis.paid30Count))}
            </p>
          </article>
          <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
            <div className="flex items-start justify-between">
              <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.kpiOutstanding}</p>
              <FigmaIcon src="/app/kpi-outstanding.svg" alt="" width={15} height={15} />
            </div>
            <KpiMoney value={kpis.outstanding} />
            <p className="mt-1 text-[14px] leading-5 text-[#BEC6E0]">
              {copy.kpiOutstandingCount.replace("{count}", String(kpis.outstandingCount))}
            </p>
          </article>
          <article className="relative overflow-hidden rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#ef4444]" />
            <div className="flex items-start justify-between pl-1">
              <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.kpiOverdue}</p>
              <FigmaIcon src="/app/kpi-overdue.svg" alt="" width={15} height={15} />
            </div>
            <KpiMoney value={kpis.overdue} accent />
            <p className="mt-1 pl-1 text-[14px] leading-5 text-[rgba(239,68,68,0.8)]">
              {copy.kpiOverdueCount.replace("{count}", String(kpis.overdueCount))}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="flex min-h-[320px] flex-col rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px] xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[24px] leading-8 font-bold text-white">{copy.revenueTrends}</h2>
              <p className="text-[14px] leading-5 text-[#BEC6E0]">{copy.last6Months}</p>
            </div>
            {advancedReports ? (
              <TrendBars points={monthly} empty={reports.trendsEmpty} />
            ) : (
              <div className="flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 rounded border border-dashed border-[rgba(198,198,205,0.3)] bg-[rgba(63,70,92,0.2)] px-4">
                <p className="text-center text-[14px] leading-5 text-[#BEC6E0]">{reports.trendsUpgrade}</p>
                <Link href="/billing" className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">
                  {billing.upgradeToBusiness}
                </Link>
              </div>
            )}
          </article>
          <div className="flex flex-col gap-4">
            <article className="flex flex-col gap-4 rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
              <h2 className="text-[24px] leading-8 font-bold text-white">{copy.quickActions}</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[#3F465C] px-3 py-2"
                  onClick={() => setClientOpen(true)}
                >
                  <FigmaIcon src="/app/action-client.svg" alt="" width={22} height={16} />
                  <span className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#F8F9FF]">{copy.addClient}</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[#3F465C] px-3 py-2"
                  onClick={() => setReminderOpen(true)}
                >
                  <FigmaIcon src="/app/action-reminder.svg" alt="" width={19} height={16} />
                  <span className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#F8F9FF]">{copy.reminder}</span>
                </button>
                <Link
                  href="/settings"
                  className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-[#C6C6CD] py-2"
                >
                  <FigmaIcon src="/app/action-stripe.svg" alt="" width={15} height={8} />
                  <span className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#F8F9FF]">{copy.connectStripe}</span>
                </Link>
              </div>
            </article>
            <article className="flex flex-col gap-2 rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
              <h2 className="text-[24px] leading-8 font-bold text-white">{copy.insights}</h2>
              <div className="flex gap-2 rounded-lg bg-[rgba(63,70,92,0.5)] p-2">
                <FigmaIcon src="/app/insight.svg" alt="" width={13} height={17} />
                <div className="flex flex-col gap-2">
                  <p className="text-[14px] leading-5 text-[#BEC6E0]">
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
                    <Link href="/billing" className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">
                      {billing.upgradeToBusiness}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E]">
          <div className="flex items-center justify-between border-b border-[rgba(198,198,205,0.5)] px-4 py-4">
            <h2 className="text-[24px] leading-8 font-bold text-white">{copy.recentInvoices}</h2>
            <Link href="/invoices" className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#6FFBBE]">
              {copy.viewAll}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-[rgba(198,198,205,0.5)] text-[12px] leading-4 tracking-[0.6px] text-[#BEC6E0]">
                  <th className="px-4 py-2 font-normal">{copy.colInvoice}</th>
                  <th className="p-2 font-normal">{copy.colClient}</th>
                  <th className="p-2 font-normal">{copy.colDate}</th>
                  <th className="p-2 text-right font-normal">{copy.colAmount}</th>
                  <th className="py-2 pr-4 pl-2 text-center font-normal">{copy.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[14px] text-[#7C839B]">
                      {copy.emptyInvoices}
                    </td>
                  </tr>
                ) : (
                  rows.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="cursor-pointer border-b border-[rgba(198,198,205,0.2)] last:border-0"
                    tabIndex={0}
                    onClick={() => router.push(`/invoices?invoice=${encodeURIComponent(invoice.id)}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/invoices?invoice=${encodeURIComponent(invoice.id)}`);
                      }
                    }}
                  >
                    <td className="px-4 py-2 text-[14px] leading-5 font-medium text-[#F8F9FF]">{invoice.invoiceNumber}</td>
                    <td className="p-2 text-[14px] leading-5 text-[#BEC6E0]">{invoice.clientName}</td>
                    <td className="p-2 text-[14px] leading-5 text-[#BEC6E0]">{invoice.date}</td>
                    <td className="p-2 text-right font-mono text-[14px] leading-5 font-medium text-[#F8F9FF]">{invoice.amount}</td>
                    <td className="py-2 pr-4 pl-2 text-center">
                      <StatusPill status={invoice.displayStatus} variant="overview" />
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <p className="text-[12px] leading-4 text-[#7C839B]">{copy.mockKpiNote}</p>
      </div>

      <Modal open={clientOpen} title={copy.addClientTitle} onClose={() => setClientOpen(false)}>
        <p className="text-[14px] leading-5 text-[#45464d]">{copy.addClientBody}</p>
        <input
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder={copy.addClientName}
          className="mt-4 h-11 w-full rounded border border-[#e2e8f0] px-3 text-[16px]"
        />
        <button
          type="button"
          disabled={clientBusy}
          className="mt-4 rounded-lg bg-[#006c49] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-50"
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
                const payload = (await response.json()) as { ok?: boolean; error?: string };
                if (!response.ok) {
                  return;
                }
                setClientName("");
                setClientOpen(false);
                router.refresh();
                void payload;
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
          <button
            type="button"
            className="mt-4 rounded-lg bg-[#006c49] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-white"
            onClick={() => setReminderOpen(false)}
          >
            {copy.addClientClose}
          </button>
        ) : (
          <Link
            href="/billing"
            className="mt-4 inline-flex rounded-lg bg-[#006c49] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-white"
          >
            {copy.upgradeCta}
          </Link>
        )}
      </Modal>
    </div>
  );
}
