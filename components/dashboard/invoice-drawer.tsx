"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FigmaIcon } from "@/components/marketing/figma-icon";
import { InvoicePreviewSkeleton } from "@/components/dashboard/invoice-preview-skeleton";
import { StatusPill } from "@/components/dashboard/status-pill";
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
    <aside className="fixed inset-0 z-20 flex flex-col border-[#C6C6CD] bg-[#131B2E] shadow-[-4px_0px_24px_rgba(0,0,0,0.1)] lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:border-l">
      <div className="flex items-start justify-between border-b border-[#C6C6CD] p-6">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{invoice.invoiceNumber}</h2>
            <StatusPill status={invoice.displayStatus} variant="drawer" />
          </div>
          <p className="text-[14px] leading-5 text-[#BEC6E0]">{invoice.clientName}</p>
        </div>
        <button type="button" className="text-[18px] leading-5 text-[#C6C6CD]" aria-label={copy.closeDrawer} onClick={onClose}>
          ×
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-6">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-[#0070F3] text-[14px] leading-5 font-medium text-white"
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
            className="flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-[#C6C6CD] text-[14px] leading-5 font-medium text-[#F8F9FF]"
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
          <Link
            href={`/invoices/${encodeURIComponent(invoice.id)}/edit`}
            className="flex size-10 items-center justify-center rounded-lg border border-[#C6C6CD]"
            aria-label={copy.edit}
          >
            <span className="app-icon-on-dark inline-flex">
              <FigmaIcon src="/landing/builder-doc.svg" alt="" width={14} height={14} />
            </span>
          </Link>
        </div>
        <section className="flex flex-col gap-2">
          <h3 className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.preview}</h3>
          <InvoicePreviewSkeleton />
        </section>
        <section className="flex flex-col gap-4">
          <h3 className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{copy.timeline}</h3>
          <ol className="relative flex flex-col gap-6 pl-6">
            <span
              aria-hidden
              className="absolute top-0 bottom-0 left-[7px] w-0.5 bg-gradient-to-b from-transparent via-[#C6C6CD] to-transparent"
            />
            {events.map((event) => (
              <li key={`${event.title}-${event.date}`} className="relative flex items-center justify-between gap-4">
                <span
                  aria-hidden
                  className="absolute top-2.5 -left-[13px] size-3 rounded-full border-2 border-[#131B2E] bg-[#C6C6CD]"
                />
                <div>
                  <p className="text-[14px] leading-5 text-[#F8F9FF]">{event.title}</p>
                  <p className="text-[10px] leading-[15px] text-[#BEC6E0]">{event.date}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  );
}
