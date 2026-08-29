"use client";

import { useState } from "react";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";

import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import type { PaymentListRow } from "@/lib/payments/present";

export function PaymentsScreen({ rows }: { rows: PaymentListRow[] }) {
  const copy = t("connect");
  const dashCopy = t("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <>
      <main className={`${dash.page} ${dash.pagePad}`}>
        <div>
          <h1 className={dash.title}>{dashCopy.nav.payments}</h1>
          <p className={dash.subtitle}>{copy.paymentsIntro}</p>
        </div>
        {rows.length === 0 ? (
          <p className="text-[14px] text-[#6B7280]">{copy.paymentsEmpty}</p>
        ) : (
          <div className={dash.tableWrap}>
            <div className={dash.tableScroll}>
              <table className={dash.dataTable}>
                <thead className={dash.tableHead}>
                  <tr>
                    <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colInvoice}</th>
                    <th className="px-4 py-3">{copy.colClient}</th>
                    <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colAmount}</th>
                    <th className={`px-4 py-3 ${dash.cellNowrap}`}>{copy.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`cursor-pointer ${dash.row} hover:bg-[#F9FAFB]`}
                      tabIndex={0}
                      onClick={() => setSelectedId(payment.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(payment.id);
                        }
                      }}
                    >
                      <td className={`px-4 py-3 ${dash.cellNowrap}`}>{payment.invoiceNumber}</td>
                      <td className={`max-w-[10rem] px-4 py-3 ${dash.ellipsis}`}>{payment.clientName}</td>
                      <td className={`px-4 py-3 ${dash.cellNowrap}`}>{payment.amount}</td>
                      <td className={`px-4 py-3 ${dash.cellNowrap}`}>{payment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      {selected ? (
        <aside className="fixed inset-0 z-20 flex max-w-full flex-col bg-white shadow-[-8px_0px_24px_rgba(15,23,42,0.08)] lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:border-l lg:border-[#E5E7EB]">
          <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] p-6">
            <div>
              <h2 className="text-[22px] font-semibold text-[#111827]">{selected.invoiceNumber}</h2>
              <p className="text-[14px] text-[#6B7280]">{selected.clientName}</p>
            </div>
            <button type="button" className="text-[#9CA3AF]" aria-label={dashCopy.closeDrawer} onClick={() => setSelectedId(null)}>
              <XIcon size={20} weight="bold" />
            </button>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <p className="font-mono text-[24px] font-semibold text-[#006C49]">{selected.amount}</p>
            <p className="text-[14px] text-[#6B7280]">{selected.status}</p>
            <p className="text-[14px] leading-5 text-[#4B5563]">{copy.paymentsIntro}</p>
            <Link href={`/invoice/${encodeURIComponent(selected.invoicePublicId)}`} className={dash.btnPrimary}>
              {dashCopy.viewPublicInvoice}
            </Link>
          </div>
        </aside>
      ) : null}
    </>
  );
}
