"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { HourglassIcon } from "@phosphor-icons/react/dist/csr/Hourglass";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";

import { InvoiceDrawer } from "@/components/dashboard/invoice-drawer";
import { StatusPill } from "@/components/dashboard/status-pill";
import { dash, downloadCsv } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import {
  computeWorkspaceKpis,
  filterInvoiceRows,
  nextListFilter,
  type InvoiceListRow,
} from "@/lib/invoices/list-view";
import type { ListStatusFilter } from "@/lib/invoices/status";

const PAGE_SIZE = 8;

export function InvoicesScreen({ invoices, remindersEnabled }: { invoices: InvoiceListRow[]; remindersEnabled: boolean }) {
  const copy = t("dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("invoice");
  const selected = invoices.find((invoice) => invoice.id === selectedId) ?? null;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ListStatusFilter>("ALL");
  const [page, setPage] = useState(0);
  const rows = useMemo(() => filterInvoiceRows(invoices, query, status), [invoices, query, status]);
  const kpis = useMemo(() => computeWorkspaceKpis(invoices), [invoices]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageIndex = Math.min(page, pageCount - 1);
  const paged = rows.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
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
    <div className={`relative ${dash.page} ${selected ? "lg:pr-[400px]" : ""}`}>
      <div className={dash.pagePad}>
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={dash.title}>{copy.invoicesTitle}</h1>
            <p className={dash.subtitle}>{copy.invoicesSubtitle}</p>
          </div>
          <Link href="/invoices/new" className={dash.btnPrimary}>
            {copy.createInvoice}
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className={dash.kpi}>
            <div className="relative z-[1] flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiListOutstanding}</p>
              <span className={dash.iconWarn}>
                <HourglassIcon size={18} weight="duotone" color="#C27803" aria-hidden />
              </span>
            </div>
            <p className={`relative z-[1] ${dash.kpiValue}`}>{kpis.outstanding}</p>
            <p className={`relative z-[1] ${dash.kpiMeta}`}>{copy.kpiOutstandingCount.replace("{count}", String(kpis.outstandingCount))}</p>
          </article>
          <article className={dash.kpi}>
            <div className="relative z-[1] flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiOverdue}</p>
              <span className={dash.iconBad}>
                <WarningCircleIcon size={18} weight="duotone" color="#DC2626" aria-hidden />
              </span>
            </div>
            <p className={`relative z-[1] ${dash.kpiValue}`}>{kpis.overdue}</p>
            <p className={`relative z-[1] ${dash.kpiMetaBad}`}>
              {kpis.overdueCount} {copy.colInvoice}
            </p>
          </article>
          <article className={dash.kpi}>
            <div className="relative z-[1] flex items-start justify-between">
              <p className={dash.kpiLabel}>{copy.kpiListPaid}</p>
              <span className={dash.iconMint}>
                <CheckCircleIcon size={18} weight="duotone" color="#006C49" aria-hidden />
              </span>
            </div>
            <p className={`relative z-[1] ${dash.kpiValue}`}>{kpis.paid30}</p>
            <p className={`relative z-[1] ${dash.kpiMetaGood}`}>
              {kpis.paid30Count} {copy.colInvoice}
            </p>
          </article>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:w-[280px]">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#6B7280]">
              <MagnifyingGlassIcon size={16} weight="bold" aria-hidden />
            </span>
            <span className="sr-only">{copy.searchInvoices}</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder={copy.searchInvoices}
              className={dash.input}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className={dash.btnSecondary}
              onClick={() => {
                setStatus((current) => nextListFilter(current));
                setPage(0);
              }}
            >
              {filterLabel}
            </button>
            <button
              type="button"
              className={dash.btnSecondary}
              onClick={() =>
                downloadCsv("invoices.csv", [
                  [copy.colInvoice, copy.colClient, copy.colDate, copy.colDueDate, copy.colAmount, copy.colStatus],
                  ...rows.map((row) => [
                    row.invoiceNumber,
                    row.clientName,
                    row.date,
                    row.dueDate,
                    row.amount,
                    row.displayStatus,
                  ]),
                ])
              }
            >
              {copy.exportCsv}
            </button>
          </div>
        </div>

        <div className={dash.tableWrap}>
          <div className={dash.tableScroll}>
            <table className={dash.dataTable}>
              <thead className={dash.tableHead}>
                <tr>
                  <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colInvoice} #</th>
                  <th className="px-4 py-3">{copy.colClient}</th>
                  <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colDate}</th>
                  <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colDueDate}</th>
                  <th className={`px-4 py-3 text-right ${dash.cellNowrap}`}>{copy.colAmount}</th>
                  <th className={`px-4 py-3 text-center ${dash.cellNowrap}`}>{copy.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-[#6B7280]">
                      {copy.emptyInvoices}
                    </td>
                  </tr>
                ) : (
                  paged.map((invoice) => {
                    const active = selected?.id === invoice.id;
                    return (
                      <tr
                        key={invoice.id}
                        className={`cursor-pointer ${dash.row} ${active ? dash.rowActive : "hover:bg-[#F9FAFB]"}`}
                        tabIndex={0}
                        onClick={() => openInvoice(invoice.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openInvoice(invoice.id);
                          }
                        }}
                      >
                        <td className={`px-4 py-4 font-mono text-[14px] ${dash.cellNowrap} ${active ? "font-semibold text-[#006C49]" : "text-[#111827]"}`}>
                          {invoice.invoiceNumber}
                        </td>
                        <td className={`max-w-[10rem] px-4 py-4 text-[14px] font-medium text-[#111827] ${dash.ellipsis}`}>{invoice.clientName}</td>
                        <td className={`px-4 py-4 text-[14px] text-[#6B7280] ${dash.cellNowrap}`}>{invoice.date}</td>
                        <td className={`px-4 py-4 text-[14px] text-[#6B7280] ${dash.cellNowrap}`}>{invoice.dueDate}</td>
                        <td className={`px-4 py-4 text-right font-mono text-[14px] text-[#111827] ${dash.cellNowrap}`}>{invoice.amount}</td>
                        <td className={`px-4 py-4 text-center ${dash.cellNowrap}`}>
                          <StatusPill status={invoice.displayStatus} variant="list" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#E5E7EB] px-4 py-3 text-[13px] text-[#6B7280]">
            <p>
              {copy.paginationShowing
                .replace("{from}", String(rows.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1))
                .replace("{to}", String(Math.min(rows.length, pageIndex * PAGE_SIZE + PAGE_SIZE)))
                .replace("{total}", String(rows.length))}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`size-8 rounded-lg text-[13px] font-medium ${
                    index === pageIndex ? "border border-[#006C49] text-[#006C49]" : "text-[#6B7280] hover:bg-[#F3F4F6]"
                  }`}
                  onClick={() => setPage(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {selected ? <InvoiceDrawer invoice={selected} remindersEnabled={remindersEnabled} onClose={closeDrawer} /> : null}
    </div>
  );
}
