"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";

import { StatusPill } from "@/components/dashboard/status-pill";
import { Modal } from "@/components/ui/modal";
import { dash, clientInitials } from "@/lib/dashboard/chrome";
import { invoicesForClient, type ClientListRow } from "@/lib/clients/list-view";
import { t } from "@/lib/i18n";
import type { InvoiceListRow } from "@/lib/invoices/list-view";
import { useToast } from "@/components/ui/toast";

function ClientStatusPill({ status }: { status: ClientListRow["status"] }) {
  const copy = t("dashboard");
  const map = {
    ACTIVE: { label: copy.clientActive, className: "bg-[#E8F5EF] text-[#006C49]" },
    PENDING: { label: copy.clientPending, className: "bg-[#FFF4E5] text-[#C2410C]" },
    OVERDUE: { label: copy.clientOverdue, className: "bg-[#FEECEC] text-[#DC2626]" },
    NONE: { label: copy.clientNone, className: "bg-[#F3F4F6] text-[#6B7280]" },
  }[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map.className}`}>{map.label}</span>
  );
}

type ClientDrawerProps = {
  client: ClientListRow;
  invoices: InvoiceListRow[];
  onClose: () => void;
};

export function ClientDrawer({ client, invoices, onClose }: ClientDrawerProps) {
  const copy = t("dashboard");
  const toast = useToast();
  const router = useRouter();
  const history = invoicesForClient(invoices, client.id);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [address, setAddress] = useState(client.address);
  const [taxNumber, setTaxNumber] = useState(client.taxNumber);
  const [notes, setNotes] = useState(client.notes);

  useEffect(() => {
    setName(client.name);
    setEmail(client.email);
    setPhone(client.phone);
    setAddress(client.address);
    setTaxNumber(client.taxNumber);
    setNotes(client.notes);
  }, [client]);

  function save() {
    if (busy) {
      return;
    }
    setBusy(true);
    void fetch(`/api/clients/${encodeURIComponent(client.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, address, taxNumber, notes }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok) {
          toast(payload.error ?? copy.saveFailed);
          return;
        }
        toast(copy.clientUpdated);
        setEditing(false);
        router.refresh();
      })
      .finally(() => setBusy(false));
  }

  function remove() {
    if (busy) {
      return;
    }
    setBusy(true);
    void fetch(`/api/clients/${encodeURIComponent(client.id)}`, { method: "DELETE" })
      .then(async (response) => {
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok) {
          toast(payload.error ?? copy.saveFailed);
          return;
        }
        toast(copy.clientDeleted);
        setConfirmDelete(false);
        onClose();
        router.refresh();
      })
      .finally(() => setBusy(false));
  }

  return (
    <aside className="fixed inset-0 z-20 flex flex-col bg-white shadow-[-8px_0px_24px_rgba(15,23,42,0.08)] lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] lg:border-l lg:border-[#E5E7EB]">
      <div className="flex items-start justify-between border-b border-[#E5E7EB] p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF] text-[13px] font-semibold text-[#006C49]">
            {clientInitials(client.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[22px] leading-8 font-semibold text-[#111827]">{client.name}</h2>
              <ClientStatusPill status={client.status} />
            </div>
            <p className="text-[14px] leading-5 text-[#6B7280]">{client.email || "—"}</p>
          </div>
        </div>
        <button type="button" className="text-[#9CA3AF]" aria-label={copy.closeClientDrawer} onClick={onClose}>
          <XIcon size={20} weight="bold" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <div className="flex gap-2">
          <Link
            href={`/invoices/new?client=${encodeURIComponent(client.id)}`}
            className={`${dash.btnPrimary} flex-1`}
          >
            {copy.createInvoice}
          </Link>
          <button
            type="button"
            className={`${dash.btnSecondary} size-10 px-0`}
            aria-label={copy.edit}
            onClick={() => setEditing((open) => !open)}
          >
            <PencilSimpleIcon size={16} weight="bold" />
          </button>
          <button
            type="button"
            className={`${dash.btnSecondary} size-10 px-0 text-[#DC2626]`}
            aria-label={copy.clientDelete}
            onClick={() => setConfirmDelete(true)}
          >
            <TrashIcon size={16} weight="bold" />
          </button>
        </div>

        {editing ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
          >
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-[#6B7280]">
              {copy.addClientName}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 rounded-lg border border-[#E5E7EB] px-3 text-[14px] font-medium text-[#111827]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-[#6B7280]">
              {copy.colEmail}
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 rounded-lg border border-[#E5E7EB] px-3 text-[14px] font-medium text-[#111827]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-[#6B7280]">
              {copy.clientPhone}
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-10 rounded-lg border border-[#E5E7EB] px-3 text-[14px] font-medium text-[#111827]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-[#6B7280]">
              {copy.clientAddress}
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="min-h-[72px] rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] font-medium text-[#111827]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-[#6B7280]">
              {copy.clientTax}
              <input
                value={taxNumber}
                onChange={(event) => setTaxNumber(event.target.value)}
                className="h-10 rounded-lg border border-[#E5E7EB] px-3 text-[14px] font-medium text-[#111827]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] font-semibold text-[#6B7280]">
              {copy.clientNotes}
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-[72px] rounded-lg border border-[#E5E7EB] px-3 py-2 text-[14px] font-medium text-[#111827]"
              />
            </label>
            <button type="submit" disabled={busy} className={`${dash.btnPrimary} disabled:opacity-50`}>
              {copy.addClientSave}
            </button>
          </form>
        ) : (
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-[12px] font-semibold tracking-[0.4px] text-[#6B7280] uppercase">{copy.preview}</p>
            <dl className="mt-4 flex flex-col gap-3 text-[14px]">
              <div>
                <dt className="text-[12px] text-[#6B7280]">{copy.colOutstandingAmount}</dt>
                <dd className="font-semibold text-[#111827]">{client.outstanding}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#6B7280]">{copy.clientPhone}</dt>
                <dd className="text-[#111827]">{client.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#6B7280]">{copy.clientAddress}</dt>
                <dd className="whitespace-pre-wrap text-[#111827]">{client.address || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#6B7280]">{copy.clientTax}</dt>
                <dd className="text-[#111827]">{client.taxNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#6B7280]">{copy.clientNotes}</dt>
                <dd className="whitespace-pre-wrap text-[#111827]">{client.notes || "—"}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-[#6B7280]">{copy.clientAdded}</dt>
                <dd className="text-[#111827]">{client.createdAt}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-[12px] font-semibold tracking-[0.4px] text-[#6B7280] uppercase">{copy.clientHistory}</h3>
          {history.length === 0 ? (
            <p className="text-[14px] text-[#6B7280]">{copy.clientHistoryEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/invoices?invoice=${encodeURIComponent(invoice.id)}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] px-3 py-3 hover:bg-[#F9FAFB]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-[#111827]">{invoice.invoiceNumber}</p>
                      <p className="text-[12px] text-[#6B7280]">{invoice.date}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="font-mono text-[13px] text-[#111827]">{invoice.amount}</p>
                      <StatusPill status={invoice.displayStatus} variant="overview" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Modal open={confirmDelete} title={copy.clientDelete} onClose={() => setConfirmDelete(false)}>
        <p className="text-[14px] leading-5 text-[#45464d]">{copy.clientDeleteBody}</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className={dash.btnSecondary} onClick={() => setConfirmDelete(false)}>
            {copy.addClientClose}
          </button>
          <button
            type="button"
            disabled={busy}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#DC2626] px-4 text-[14px] font-semibold text-white disabled:opacity-50"
            onClick={remove}
          >
            {copy.clientDelete}
          </button>
        </div>
      </Modal>
    </aside>
  );
}
