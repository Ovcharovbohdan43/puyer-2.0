"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AddClientFields } from "@/components/dashboard/add-client-fields";
import { ClientDrawer } from "@/components/dashboard/client-drawer";
import { KpiSparkline } from "@/components/dashboard/kpi-sparkline";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { HourglassIcon } from "@phosphor-icons/react/dist/csr/Hourglass";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { UsersIcon } from "@phosphor-icons/react/dist/csr/Users";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { dash, clientInitials, downloadCsv } from "@/lib/dashboard/chrome";
import { kpiSparkSpecs, sparkMonthlyFromInvoices } from "@/lib/dashboard/kpi-sparkline";
import {
  computeClientKpis,
  filterClientRows,
  nextClientFilter,
  presentClientRows,
  type ClientSource,
  type ClientStatusKind,
} from "@/lib/clients/list-view";
import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { computeWorkspaceKpis, type InvoiceListRow } from "@/lib/invoices/list-view";

const PAGE_SIZE = 8;

function ClientStatusPill({ status }: { status: ClientStatusKind }) {
  const copy = t("dashboard");
  const map = {
    ACTIVE: { label: copy.clientActive, className: "bg-[#E8F5EF] text-[#006C49]" },
    PENDING: { label: copy.clientPending, className: "bg-[#FFF4E5] text-[#C2410C]" },
    OVERDUE: { label: copy.clientOverdue, className: "bg-[#FEECEC] text-[#DC2626]" },
    NONE: { label: copy.clientNone, className: "bg-[#F3F4F6] text-[#6B7280]" },
  }[status];
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map.className}`}>{map.label}</span>
  );
}

export function ClientsScreen({
  clients,
  invoices,
}: {
  clients: ClientSource[];
  invoices: InvoiceListRow[];
}) {
  const copy = t("dashboard");
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ClientStatusKind>("ALL");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const presented = useMemo(() => presentClientRows(clients, invoices), [clients, invoices]);
  const selected = presented.find((client) => client.id === selectedId) ?? null;
  const rows = useMemo(() => filterClientRows(presented, query, status), [presented, query, status]);
  const kpis = useMemo(() => computeClientKpis(presented), [presented]);
  const sparks = useMemo(
    () => kpiSparkSpecs(sparkMonthlyFromInvoices(invoices), computeWorkspaceKpis(invoices)),
    [invoices],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageIndex = Math.min(page, pageCount - 1);
  const paged = rows.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
  const filterLabel =
    status === "ALL"
      ? copy.filter
      : {
          ACTIVE: copy.clientActive,
          PENDING: copy.clientPending,
          OVERDUE: copy.clientOverdue,
          NONE: copy.clientNone,
        }[status];

  function openClient(id: string) {
    router.replace(`/clients?client=${encodeURIComponent(id)}`, { scroll: false });
  }

  function closeDrawer() {
    router.replace("/clients", { scroll: false });
  }

  return (
    <div className={`relative ${dash.page} ${selected ? "lg:pr-[400px]" : ""}`}>
      <div className={dash.pagePad}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className={dash.title}>{copy.nav.clients}</h1>
        <button type="button" className={dash.btnPrimary} onClick={() => setFormOpen((open) => !open)}>
          {copy.addClient}
        </button>
      </header>

      {formOpen ? (
        <form
          className={`${dash.card} flex flex-col gap-3 p-4`}
          onSubmit={(event) => {
            event.preventDefault();
            if (busy) {
              return;
            }
            setBusy(true);
            void fetch("/api/clients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, phone }),
            })
              .then(async (response) => {
                const payload = (await response.json()) as { ok?: boolean; error?: string };
                if (!response.ok) {
                  toast(payload.error ?? copy.saveFailed);
                  return;
                }
                setName("");
                setEmail("");
                setPhone("");
                setFormOpen(false);
                router.refresh();
              })
              .finally(() => setBusy(false));
          }}
        >
          <AddClientFields
            name={name}
            email={email}
            phone={phone}
            namePlaceholder={copy.addClientName}
            emailPlaceholder={copy.addClientEmail}
            phonePlaceholder={copy.addClientPhone}
            onName={setName}
            onEmail={setEmail}
            onPhone={setPhone}
          />
          <button type="submit" disabled={busy} className={`${dash.btnPrimary} self-start disabled:opacity-50`}>
            {copy.addClientSave}
          </button>
        </form>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={`${dash.kpi} min-h-[148px]`}>
          <KpiSparkline id="clients-total" values={sparks.revenue.values} tone={sparks.revenue.tone} />
          <div className="relative z-[1] flex items-start justify-between">
            <p className={dash.kpiLabel}>{copy.kpiTotalClients}</p>
            <span className={dash.iconMint}>
              <UsersIcon size={18} weight="duotone" color="#006C49" aria-hidden />
            </span>
          </div>
          <p className={`relative z-[1] ${dash.kpiValue}`}>{kpis.total}</p>
        </article>
        <article className={`${dash.kpi} min-h-[148px]`}>
          <KpiSparkline id="clients-outstanding" values={sparks.outstanding.values} tone={sparks.outstanding.tone} />
          <div className="relative z-[1] flex items-start justify-between">
            <p className={dash.kpiLabel}>{copy.kpiListOutstanding}</p>
            <span className={dash.iconWarn}>
              <HourglassIcon size={18} weight="duotone" color="#C27803" aria-hidden />
            </span>
          </div>
          <p className={`relative z-[1] ${dash.kpiValue}`}>{kpis.outstanding}</p>
        </article>
        <article className={`${dash.kpi} min-h-[148px]`}>
          <KpiSparkline id="clients-overdue" values={sparks.overdue.values} tone={sparks.overdue.tone} />
          <div className="relative z-[1] flex items-start justify-between">
            <p className={dash.kpiLabel}>{copy.kpiOverdue}</p>
            <span className={dash.iconBad}>
              <WarningCircleIcon size={18} weight="duotone" color="#DC2626" aria-hidden />
            </span>
          </div>
          <p className={`relative z-[1] ${dash.kpiValue} text-[#DC2626]`}>{kpis.overdue}</p>
        </article>
        <article className={`${dash.kpi} min-h-[148px]`}>
          <KpiSparkline id="clients-active" values={sparks.paid.values} tone={sparks.paid.tone} />
          <div className="relative z-[1] flex items-start justify-between">
            <p className={dash.kpiLabel}>{copy.kpiActiveClients}</p>
            <span className={dash.iconMint}>
              <CheckCircleIcon size={18} weight="duotone" color="#006C49" aria-hidden />
            </span>
          </div>
          <p className={`relative z-[1] ${dash.kpiValue}`}>{kpis.paidLikeCount}</p>
        </article>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:w-[280px]">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#6B7280]">
            <MagnifyingGlassIcon size={16} weight="bold" aria-hidden />
          </span>
          <span className="sr-only">{copy.searchClients}</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={copy.searchClients}
            className={dash.input}
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className={dash.btnSecondary}
            onClick={() => {
              setStatus((current) => nextClientFilter(current));
              setPage(0);
            }}
          >
            {filterLabel}
          </button>
          <button
            type="button"
            className={dash.btnSecondary}
            onClick={() =>
              downloadCsv("clients.csv", [
                [copy.colClient, copy.colEmail, copy.colOutstandingAmount, copy.colLastInvoice, copy.colStatus],
                ...rows.map((row) => [row.name, row.email, row.outstanding, row.lastInvoiceDate ?? "", row.status]),
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
                <th className="px-4 py-3">{copy.colClient}</th>
                <th className="px-4 py-3">{copy.colEmail}</th>
                <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colOutstandingAmount}</th>
                <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colLastInvoice}</th>
                <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colStatus}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-[#6B7280]">
                    {copy.clientsSoon}
                  </td>
                </tr>
              ) : (
                paged.map((client) => {
                  const active = selected?.id === client.id;
                  return (
                    <tr
                      key={client.id}
                      className={`cursor-pointer ${dash.row} ${active ? dash.rowActive : "hover:bg-[#F9FAFB]"}`}
                      tabIndex={0}
                      onClick={() => openClient(client.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openClient(client.id);
                        }
                      }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 max-w-[12rem] items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF] text-[12px] font-semibold text-[#006C49]">
                            {clientInitials(client.name)}
                          </span>
                          <p className={`truncate text-[14px] font-semibold ${active ? "text-[#006C49]" : "text-[#111827]"}`}>
                            {client.name}
                          </p>
                        </div>
                      </td>
                      <td className={`max-w-[12rem] px-4 py-4 text-[14px] text-[#6B7280] ${dash.ellipsis}`}>{client.email || "—"}</td>
                      <td className={`px-4 py-4 text-[14px] font-semibold text-[#111827] ${dash.cellNowrap}`}>{client.outstanding}</td>
                      <td className={`px-4 py-4 text-[14px] text-[#6B7280] ${dash.cellNowrap}`}>{client.lastInvoiceDate ?? "—"}</td>
                      <td className={`px-4 py-4 ${dash.cellNowrap}`}>
                        <ClientStatusPill status={client.status} />
                      </td>
                      <td className={`px-4 py-4 text-right ${dash.cellNowrap}`}>
                        <Link
                          href={`/invoices/new?client=${encodeURIComponent(client.id)}`}
                          className={dash.link}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {copy.createInvoice}
                        </Link>
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
                  index === pageIndex ? "border border-[#006C49] text-[#006C49]" : "text-[#6B7280]"
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
      {selected ? <ClientDrawer key={selected.id} client={selected} invoices={invoices} onClose={closeDrawer} /> : null}
    </div>
  );
}
