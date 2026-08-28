"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FigmaIcon } from "@/components/marketing/figma-icon";
import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import { StatusPill } from "@/components/dashboard/status-pill";
import { t } from "@/lib/i18n";
import {
  computeWorkspaceKpis,
  filterInvoiceRows,
  nextListFilter,
  type InvoiceListRow,
} from "@/lib/invoices/list-view";
import type { ListStatusFilter } from "@/lib/invoices/status";

export function InvoicesScreen({ invoices }: { invoices: InvoiceListRow[] }) {
  const copy = t("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("invoice");
  const selected = invoices.find((invoice) => invoice.id === selectedId) ?? null;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ListStatusFilter>("ALL");
  const rows = useMemo(() => filterInvoiceRows(invoices, query, status), [invoices, query, status]);
  const kpis = useMemo(() => computeWorkspaceKpis(invoices), [invoices]);
  const filterLabel =
    status === "ALL"
      ? copy.filter
      : {
          PENDING: copy.statusPending,
          PAID: copy.statusPaid,
          OVERDUE: copy.statusOverdue,
          DRAFT: copy.statusDraft,
          CANCELED: copy.statusCanceled,
        }[status];

  function openInvoice(id: string) {
    router.replace(`/invoices?invoice=${encodeURIComponent(id)}`, { scroll: false });
  }

  function closeDrawer() {
    router.replace("/invoices", { scroll: false });
  }

  return (
    <div className={`relative min-h-dvh bg-[#0B1320] ${selected ? "lg:pr-[400px]" : ""}`}>
      <div className="flex flex-col gap-8 p-6 lg:p-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.32px] text-[#F8F9FF]">{copy.invoicesTitle}</h1>
            <p className="mt-1 text-[14px] leading-5 text-[#7C839B]">{copy.invoicesSubtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative block w-[256px]">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                <FigmaIcon src="/app/search.svg" alt="" width={15} height={15} />
              </span>
              <span className="sr-only">{copy.searchInvoices}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchInvoices}
                className="h-[38px] w-full rounded-lg border border-[#C6C6CD] bg-[#131B2E] py-2 pr-4 pl-10 text-[14px] text-[#F8F9FF] outline-none placeholder:text-[#C6C6CD]"
              />
            </label>
            <button
              type="button"
              className="flex h-[38px] items-center gap-1 rounded-lg border border-[#C6C6CD] bg-[#131B2E] px-3 text-[14px] leading-5 text-[#BEC6E0]"
              onClick={() => setStatus((current) => nextListFilter(current))}
            >
              <FigmaIcon src="/app/select-chevron.svg" alt="" width={14} height={9} />
              {filterLabel}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="flex flex-col gap-2 rounded-lg border border-[#C6C6CD] bg-[#131B2E] p-6">
            <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.kpiListOutstanding}</p>
            <p className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{kpis.outstanding}</p>
          </article>
          <article className="flex flex-col gap-2 rounded-lg border border-[#C6C6CD] bg-[#131B2E] p-6">
            <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.kpiOverdue}</p>
            <p className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{kpis.overdue}</p>
            <p className="text-[14px] leading-5 text-[#EF4444]">
              {kpis.overdueCount} {copy.colInvoice}
            </p>
          </article>
          <article className="flex flex-col gap-2 rounded-lg border border-[#C6C6CD] bg-[#131B2E] p-6">
            <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.kpiListPaid}</p>
            <p className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{kpis.paid30}</p>
            <p className="text-[14px] leading-5 text-[#4EDEA3]">
              {kpis.paid30Count} {copy.colInvoice}
            </p>
          </article>
        </section>
        <p className="text-[12px] leading-4 text-[#7C839B]">{copy.mockKpiNote}</p>

        <div className="overflow-hidden rounded-lg border border-[#C6C6CD] bg-[#131B2E]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-[#3F465C]">
                <tr className="border-b border-[#C6C6CD] text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">
                  <th className="px-4 py-[19px]">{copy.colInvoice} #</th>
                  <th className="px-4 py-[19px]">{copy.colClient}</th>
                  <th className="px-4 py-[19px]">{copy.colDate}</th>
                  <th className="px-4 py-[19px]">{copy.colDueDate}</th>
                  <th className="px-4 py-[19px] text-right">{copy.colAmount}</th>
                  <th className="px-4 py-[19px] text-center">{copy.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-[#7C839B]">
                      {copy.emptyInvoices}
                    </td>
                  </tr>
                ) : (
                  rows.map((invoice) => {
                    const active = selected?.id === invoice.id;
                    return (
                      <tr
                        key={invoice.id}
                        className={`cursor-pointer border-b border-[#C6C6CD] ${active ? "bg-[rgba(63,70,92,0.5)]" : ""}`}
                        tabIndex={0}
                        onClick={() => openInvoice(invoice.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openInvoice(invoice.id);
                          }
                        }}
                      >
                        <td className={`px-4 py-4 font-mono text-[14px] leading-5 ${active ? "text-[#6FFBBE]" : "text-[#F8F9FF]"}`}>
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-4 py-4 text-[14px] leading-5 font-medium text-[#F8F9FF]">{invoice.clientName}</td>
                        <td className="px-4 py-4 text-[14px] leading-5 text-[#BEC6E0]">{invoice.date}</td>
                        <td className="px-4 py-4 text-[14px] leading-5 text-[#BEC6E0]">{invoice.dueDate}</td>
                        <td className="px-4 py-4 text-right font-mono text-[14px] leading-5 text-[#F8F9FF]">{invoice.amount}</td>
                        <td className="px-4 py-4 text-center">
                          <StatusPill status={invoice.displayStatus} variant="list" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {selected ? <InvoiceDrawer invoice={selected} onClose={closeDrawer} /> : null}
    </div>
  );
}
