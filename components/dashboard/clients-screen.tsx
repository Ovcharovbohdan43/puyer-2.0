"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";

type ClientRow = { id: string; name: string; email: string; address: string };

export function ClientsScreen({ clients }: { clients: ClientRow[] }) {
  const copy = t("dashboard");
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{copy.nav.clients}</h1>
        <p className="mt-2 text-[14px] leading-5 text-[#BEC6E0]">{copy.clientsSoon}</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (busy) {
            return;
          }
          setBusy(true);
          void fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          })
            .then(async (response) => {
              const payload = (await response.json()) as { ok?: boolean; error?: string };
              if (!response.ok) {
                toast(payload.error ?? copy.saveFailed);
                return;
              }
              setName("");
              router.refresh();
            })
            .finally(() => setBusy(false));
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={copy.addClientName}
          className="h-10 flex-1 rounded-lg border border-[#C6C6CD] bg-[#131B2E] px-3 text-[14px] text-[#F8F9FF]"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[#6FFBBE] px-4 text-[14px] font-semibold text-[#002113] disabled:opacity-50"
        >
          {copy.addClientSave}
        </button>
      </form>
      <ul className="divide-y divide-[#C6C6CD] rounded-lg border border-[#C6C6CD] bg-[#131B2E]">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[14px] font-medium text-[#F8F9FF]">{client.name}</p>
              <p className="text-[12px] text-[#7C839B]">{client.email || client.address}</p>
            </div>
            <Link
              href={`/invoices/new?client=${encodeURIComponent(client.id)}`}
              className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]"
            >
              {copy.createInvoice}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
