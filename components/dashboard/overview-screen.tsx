"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/csr/ChartLineUp";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CreditCardIcon } from "@phosphor-icons/react/dist/csr/CreditCard";
import { LightbulbIcon } from "@phosphor-icons/react/dist/csr/Lightbulb";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { UsersIcon } from "@phosphor-icons/react/dist/csr/Users";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { HourglassIcon } from "@phosphor-icons/react/dist/csr/Hourglass";

import { StatusPill } from "@/components/dashboard/status-pill";
import { KpiSparkline } from "@/components/dashboard/kpi-sparkline";
import { Modal } from "@/components/ui/modal";
import { dash } from "@/lib/dashboard/chrome";
import { kpiSparkSpecs } from "@/lib/dashboard/kpi-sparkline";
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
  monthly: PresentedTrend[];
  insights: PaymentInsight | null;
};

function KpiMoney({ value, accent }: { value: string; accent?: boolean }) {
  const { major, cents } = splitMoneyDisplay(value);
  return (
    <p className={`relative z-[1] flex items-end tracking-[-0.4px] ${accent ? "text-[#DC2626]" : "text-[#111827]"}`}>
      <span className="text-[32px] leading-10 font-semibold lg:text-[36px] lg:leading-[44px]">{major}</span>
      {cents ? <span className={`pb-1 text-[18px] leading-7 ${accent ? "opacity-70" : "text-[#6B7280]"}`}>{cents}</span> : null}
    </p>
  );
}

function QuickAction({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-4 shadow-[0px_1px_2px_rgba(15,23,42,0.06)] transition-colors hover:border-[#006C49]/35 hover:bg-[#F6FBF8]"
      onClick={onClick}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[#E8F5EF] text-[#006C49]">{children}</span>
      <span className="text-[12px] font-semibold text-[#111827]">{label}</span>
    </button>
  );
}

export function OverviewScreen({
  name,
  email,
  remindersEnabled,
  recent,
  kpis,
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
  const sparks = useMemo(() => kpiSparkSpecs(monthly, kpis), [monthly, kpis]);

  return (
    <div className={dash.page}>
      <header className="flex flex-col gap-4 border-b border-[#E5E7EB] bg-white px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[24px] leading-8 font-semibold text-[#111827]">{copy[greetingKey].replace("{name}", firstName)}</h1>
          <p className="text-[14px] leading-5 text-[#6B7280]">{copy.overviewSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative hidden w-[256px] sm:block">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#6B7280]">
              <MagnifyingGlassIcon size={16} weight="bold" aria-hidden />
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
            <KpiSparkline id="kpi-revenue" values={sparks.revenue.values} tone={sparks.revenue.tone} />
            <div className="relative z-[1] flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiTotalRevenue}</p>
              <span className={dash.iconMint}>
                <ChartLineUpIcon size={18} weight="duotone" color="#006C49" aria-hidden />
              </span>
            </div>
            <KpiMoney value={kpis.revenue} />
            <p className={`relative z-[1] ${dash.kpiMetaGood}`}>{copy.kpiFromWorkspace}</p>
          </article>
          <article className={dash.kpi}>
            <KpiSparkline id="kpi-paid" values={sparks.paid.values} tone={sparks.paid.tone} />
            <div className="relative z-[1] flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiPaid30}</p>
              <span className={dash.iconMint}>
                <CheckCircleIcon size={18} weight="duotone" color="#006C49" aria-hidden />
              </span>
            </div>
            <KpiMoney value={kpis.paid30} />
            <p className={`relative z-[1] ${dash.kpiMeta}`}>{copy.kpiPaidCount.replace("{count}", String(kpis.paid30Count))}</p>
          </article>
          <article className={dash.kpi}>
            <KpiSparkline id="kpi-outstanding" values={sparks.outstanding.values} tone={sparks.outstanding.tone} />
            <div className="relative z-[1] flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiOutstanding}</p>
              <span className={dash.iconWarn}>
                <HourglassIcon size={18} weight="duotone" color="#C27803" aria-hidden />
              </span>
            </div>
            <KpiMoney value={kpis.outstanding} />
            <p className={`relative z-[1] ${dash.kpiMeta}`}>{copy.kpiOutstandingCount.replace("{count}", String(kpis.outstandingCount))}</p>
          </article>
          <article className={dash.kpi}>
            <KpiSparkline id="kpi-overdue" values={sparks.overdue.values} tone={sparks.overdue.tone} />
            <div className="relative z-[1] flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiOverdue}</p>
              <span className={dash.iconBad}>
                <WarningCircleIcon size={18} weight="duotone" color="#DC2626" aria-hidden />
              </span>
            </div>
            <KpiMoney value={kpis.overdue} accent />
            <p className={`relative z-[1] ${dash.kpiMetaBad}`}>{copy.kpiOverdueCount.replace("{count}", String(kpis.overdueCount))}</p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <article className={`${dash.card} flex min-h-[320px] flex-col p-5 xl:col-span-2`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.revenueTrends}</h2>
              <p className="text-[14px] text-[#6B7280]">{copy.last6Months}</p>
            </div>
            <TrendBars points={monthly} empty={reports.trendsEmpty} />
          </article>
          <div className="flex flex-col gap-4">
            <article className={`${dash.card} flex flex-col gap-4 p-5`}>
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.quickActions}</h2>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction label={copy.addClient} onClick={() => setClientOpen(true)}>
                  <UsersIcon size={20} weight="duotone" color="#006C49" aria-hidden />
                </QuickAction>
                <QuickAction label={copy.reminder} onClick={() => setReminderOpen(true)}>
                  <BellIcon size={20} weight="duotone" color="#006C49" aria-hidden />
                </QuickAction>
                <Link
                  href="/settings"
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-[#006C49]/20 bg-[#F6FBF8] py-3 text-[#006C49] transition-colors hover:border-[#006C49]/40 hover:bg-[#E8F5EF]"
                >
                  <CreditCardIcon size={20} weight="duotone" color="#006C49" aria-hidden />
                  <span className="text-[12px] font-semibold">{copy.connectStripe}</span>
                </Link>
              </div>
            </article>
            <article className={`${dash.card} flex flex-col gap-2 p-5`}>
              <h2 className="text-[20px] font-semibold text-[#111827]">{copy.insights}</h2>
              <div className="flex gap-3 rounded-xl border border-[#D1EDE0] bg-[#F3FAF6] p-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#006C49]">
                  <LightbulbIcon size={16} weight="duotone" color="#006C49" aria-hidden />
                </span>
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
