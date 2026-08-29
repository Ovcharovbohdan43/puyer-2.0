"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PuyerLogo } from "@/components/brand/puyer-logo";
import { FigmaIcon } from "@/components/marketing/figma-icon";
import { StatusPill } from "@/components/dashboard/status-pill";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import type { InvoiceListRow } from "@/lib/invoices/list-view";
import { canTransition } from "@/lib/invoices/status";
import { downloadPdfResponse } from "@/lib/pdf/browser-download";
import { useToast } from "@/components/ui/toast";

type InvoiceDrawerProps = {
  invoice: InvoiceListRow;
  onClose: () => void;
};

export function InvoiceDrawer({ invoice, onClose }: InvoiceDrawerProps) {
  const copy = t("dashboard");
  const toast = useToast();
  const router = useRouter();
  const publicHref = `${typeof window === "undefined" ? "" : window.location.origin}/invoice/${invoice.publicId}`;

  const events = [
    invoice.viewedAt
      ? { title: copy.invoiceViewed, date: invoice.viewedAt, paid: false }
      : null,
    invoice.sentAt ? { title: copy.invoiceSent, date: invoice.sentAt, paid: false } : null,
    { title: copy.invoiceCreated, date: invoice.createdAt, paid: false },
  ].filter((event): event is { title: string; date: string; paid: boolean } => Boolean(event));

  return (
    <aside className="fixed inset-0 z-20 flex max-w-full flex-col overflow-x-hidden bg-white shadow-[-8px_0px_24px_rgba(15,23,42,0.08)] lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:border-l lg:border-[#E5E7EB]">
      <div className="flex min-w-0 items-start justify-between gap-3 border-b border-[#E5E7EB] p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="min-w-0 truncate text-[22px] leading-8 font-semibold text-[#111827]">{invoice.invoiceNumber}</h2>
            <StatusPill status={invoice.displayStatus} variant="drawer" />
          </div>
          <p className="truncate text-[14px] leading-5 text-[#6B7280]">{invoice.clientName}</p>
        </div>
        <button type="button" className="shrink-0 text-[22px] leading-5 text-[#9CA3AF]" aria-label={copy.closeDrawer} onClick={onClose}>
          ×
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden p-6">
        <div className="flex gap-2">
          <button
            type="button"
            className={`${dash.btnPrimary} flex-1`}
            onClick={() => {
              void downloadPdfResponse(`/api/invoices/${invoice.id}/pdf`, `${invoice.invoiceNumber}.pdf`)
                .then(() => toast(copy.downloadedLater))
                .catch(() => toast(copy.pdfFailed));
            }}
          >
            <FigmaIcon src="/landing/download.svg" alt="" width={12} height={12} />
            {copy.download}
          </button>
          <button
            type="button"
            className={`${dash.btnSecondary} flex-1`}
            onClick={() => {
              void navigator.clipboard.writeText(publicHref);
              toast(copy.copyPublicLink);
              if (canTransition(invoice.status, "SENT")) {
                void fetch(`/api/invoices/${invoice.id}/send`, { method: "POST" }).then(() => {
                  router.refresh();
                });
              }
            }}
          >
            {copy.share}
          </button>
          <Link href={`/invoices/${encodeURIComponent(invoice.id)}/edit`} className={`${dash.btnSecondary} size-10 px-0`} aria-label={copy.edit}>
            <FigmaIcon src="/landing/builder-doc.svg" alt="" width={14} height={14} />
          </Link>
        </div>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-[12px] text-[#6B7280]">
            {copy.previewTo.replace("{client}", invoice.clientName)}
          </p>
          <p className="mt-1 text-[12px] text-[#6B7280]">
            {copy.previewSubject.replace("{number}", invoice.invoiceNumber)}
          </p>
          <div className="mt-5">
            <PuyerLogo height={22} />
            <h3 className="mt-4 text-[20px] font-semibold text-[#111827]">{copy.preview}</h3>
            <p className="mt-2 text-[14px] leading-5 text-[#4B5563]">
              {copy.previewBody
                .replace("{client}", invoice.clientName)
                .replace("{number}", invoice.invoiceNumber)
                .replace("{due}", invoice.dueDate)}
            </p>
            <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
              <p className="text-[12px] text-[#6B7280]">{copy.invoiceAmount}</p>
              <p className="text-[24px] font-semibold text-[#006C49]">{invoice.amount}</p>
              <p className="text-[12px] text-[#6B7280]">
                {copy.colDueDate}: {invoice.dueDate}
              </p>
            </div>
            <a href={publicHref} className={`${dash.btnPrimary} mt-4 w-full`}>
              {copy.viewPublicInvoice}
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[12px] font-semibold tracking-[0.4px] text-[#6B7280] uppercase">{copy.timeline}</h3>
          <ol className="relative flex flex-col gap-6 pl-6">
            <span aria-hidden className="absolute top-0 bottom-0 left-[7px] w-0.5 bg-[#E5E7EB]" />
            {events.map((event) => (
              <li key={`${event.title}-${event.date}`} className="relative flex items-center justify-between gap-4">
                <span aria-hidden className="absolute top-2.5 -left-[13px] size-3 rounded-full border-2 border-white bg-[#006C49]" />
                <div>
                  <p className="text-[14px] leading-5 text-[#111827]">{event.title}</p>
                  <p className="text-[12px] leading-[15px] text-[#6B7280]">{event.date}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  );
}
