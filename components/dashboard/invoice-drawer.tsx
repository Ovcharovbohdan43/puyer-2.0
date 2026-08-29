"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";

import { InvoiceTimeline, type TimelineEvent } from "@/components/dashboard/invoice-timeline";
import { PuyerLogo } from "@/components/brand/puyer-logo";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Modal } from "@/components/ui/modal";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import type { InvoiceListRow } from "@/lib/invoices/list-view";
import { canTransition, isEditableStatus, manualStatusOptions } from "@/lib/invoices/status";
import type { InvoiceStatus } from "@prisma/client";
import { downloadPdfResponse } from "@/lib/pdf/browser-download";
import { useToast } from "@/components/ui/toast";

type InvoiceDrawerProps = {
  invoice: InvoiceListRow;
  remindersEnabled: boolean;
  onClose: () => void;
};

function statusLabel(status: InvoiceStatus): string {
  const copy = t("dashboard");
  const map: Partial<Record<InvoiceStatus, string>> = {
    DRAFT: copy.statusDraft,
    READY: copy.statusReady,
    SENT: copy.statusSent,
    VIEWED: copy.statusViewed,
    PARTIALLY_PAID: copy.statusPartial,
    PAID: copy.statusPaid,
    OVERDUE: copy.statusOverdue,
    CANCELED: copy.statusCanceled,
  };
  return map[status] ?? status;
}

export function InvoiceDrawer({ invoice, remindersEnabled, onClose }: InvoiceDrawerProps) {
  const copy = t("dashboard");
  const toast = useToast();
  const router = useRouter();
  const publicHref = `${typeof window === "undefined" ? "" : window.location.origin}/invoice/${invoice.publicId}`;
  const nextStatuses = manualStatusOptions(invoice.status);
  const defaultMessage = copy.reminderDraft
    .replace("{client}", invoice.clientName)
    .replace("{number}", invoice.invoiceNumber)
    .replace("{amount}", invoice.amount)
    .replace("{due}", invoice.dueDate);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [busy, setBusy] = useState(false);

  const events = useMemo((): TimelineEvent[] => {
    const items: TimelineEvent[] = [];
    if (invoice.status === "PAID" || invoice.paidAt) {
      items.unshift({
        kind: "paid",
        title: copy.paymentReceived,
        date: invoice.paidAt ?? invoice.createdAt,
      });
    }
    if (invoice.viewedAt) {
      items.push({ kind: "viewed", title: copy.invoiceViewed, date: invoice.viewedAt });
    }
    if (invoice.sentAt) {
      items.push({ kind: "sent", title: copy.invoiceSent, date: invoice.sentAt });
    }
    items.push({ kind: "created", title: copy.invoiceCreated, date: invoice.createdAt });
    return items;
  }, [
    copy.invoiceCreated,
    copy.invoiceSent,
    copy.invoiceViewed,
    copy.paymentReceived,
    invoice.createdAt,
    invoice.paidAt,
    invoice.sentAt,
    invoice.status,
    invoice.viewedAt,
  ]);

  function sendReminder() {
    if (!remindersEnabled) {
      toast(copy.reminderUpgrade);
      return;
    }
    if (busy) {
      return;
    }
    setBusy(true);
    void fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok) {
          toast(payload.error ?? copy.saveFailed);
          return;
        }
        toast(copy.reminderSent);
        setReminderOpen(false);
      })
      .finally(() => setBusy(false));
  }

  function changeStatus(next: InvoiceStatus) {
    if (busy || next === invoice.status) {
      return;
    }
    setBusy(true);
    void fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok) {
          toast(payload.error ?? copy.saveFailed);
          return;
        }
        toast(copy.statusUpdated);
        router.refresh();
      })
      .finally(() => setBusy(false));
  }

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
        <button type="button" className="shrink-0 text-[#9CA3AF]" aria-label={copy.closeDrawer} onClick={onClose}>
          <XIcon size={20} weight="bold" />
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
            <DownloadSimpleIcon size={16} weight="bold" aria-hidden />
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
          {isEditableStatus(invoice.status) ? (
            <Link href={`/invoices/${encodeURIComponent(invoice.id)}/edit`} className={`${dash.btnSecondary} size-10 px-0`} aria-label={copy.edit}>
              <PencilSimpleIcon size={16} weight="bold" />
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={`${dash.btnSecondary} w-full`}
            onClick={() => {
              if (!remindersEnabled) {
                toast(copy.reminderUpgrade);
                return;
              }
              setMessage(defaultMessage);
              setReminderOpen(true);
            }}
          >
            <BellIcon size={16} weight="duotone" aria-hidden />
            {copy.sendReminder}
          </button>
          {nextStatuses.length > 0 ? (
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-[#6B7280]">
              {copy.setInvoiceStatus}
              <select
                className="h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] font-medium text-[#111827]"
                value=""
                disabled={busy}
                onChange={(event) => {
                  const value = event.target.value as InvoiceStatus;
                  event.target.value = "";
                  if (value) {
                    changeStatus(value);
                  }
                }}
              >
                <option value="">{copy.chooseStatus}</option>
                {nextStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <p className="text-[12px] text-[#6B7280]">{copy.previewTo.replace("{client}", invoice.clientName)}</p>
          <p className="mt-1 text-[12px] text-[#6B7280]">{copy.previewSubject.replace("{number}", invoice.invoiceNumber)}</p>
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

        <InvoiceTimeline events={events} />
      </div>

      <Modal open={reminderOpen} title={copy.sendReminder} onClose={() => setReminderOpen(false)}>
        <p className="text-[14px] leading-5 text-[#45464d]">{copy.reminderEditHint}</p>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-4 min-h-[140px] w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] text-[#111827]"
        />
        <p className="mt-2 text-[12px] text-[#6B7280]">{copy.reminderFromNote}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className={dash.btnSecondary} onClick={() => setReminderOpen(false)}>
            {copy.addClientClose}
          </button>
          <button type="button" disabled={busy} className={`${dash.btnPrimary} flex-1 disabled:opacity-50`} onClick={sendReminder}>
            {copy.sendReminder}
          </button>
        </div>
      </Modal>
    </aside>
  );
}
