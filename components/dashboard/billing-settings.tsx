"use client";

import { useState } from "react";
import Link from "next/link";

import { t } from "@/lib/i18n";

type BillingSettingsProps = {
  isOwner: boolean;
  planLabel: string;
  statusLabel: string;
  periodEndLabel: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
  canCheckout: boolean;
};

export function BillingSettings({
  isOwner,
  planLabel,
  statusLabel,
  periodEndLabel,
  cancelAtPeriodEnd,
  hasCustomer,
  canCheckout,
}: BillingSettingsProps) {
  const copy = t("billing");
  const dash = t("dashboard");
  const [pending, setPending] = useState<"pro" | "business" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: "PRO" | "BUSINESS") {
    setPending(plan === "PRO" ? "pro" : "business");
    setError(null);
    try {
      const response = await fetch("/api/stripe/platform/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: "month" }),
      });
      const body = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error || copy.checkoutFailed);
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError(copy.checkoutFailed);
    } finally {
      setPending(null);
    }
  }

  async function openPortal() {
    setPending("portal");
    setError(null);
    try {
      const response = await fetch("/api/stripe/platform/portal", { method: "POST" });
      const body = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error || copy.portalFailed);
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError(copy.portalFailed);
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <p className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">{dash.nav.billing}</p>
      <h1 className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{copy.title}</h1>
      <p className="text-[14px] leading-5 text-[#BEC6E0]">{copy.body}</p>
      <div className="flex flex-col gap-1 rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-4">
        <p className="text-[16px] font-semibold text-[#F8F9FF]">{planLabel}</p>
        <p className="text-[14px] text-[#BEC6E0]">{statusLabel}</p>
        {periodEndLabel ? <p className="text-[12px] text-[#BEC6E0]">{periodEndLabel}</p> : null}
        {cancelAtPeriodEnd ? <p className="text-[12px] text-[#ff8a80]">{copy.cancelScheduled}</p> : null}
      </div>
      {isOwner ? (
        <div className="flex flex-wrap gap-3">
          {canCheckout ? (
            <>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void checkout("PRO")}
                className="rounded-lg bg-[#6FFBBE] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0B1320] disabled:opacity-60"
              >
                {pending === "pro" ? copy.redirecting : copy.subscribePro}
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => void checkout("BUSINESS")}
                className="rounded-lg border border-[#C6C6CD] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#F8F9FF] disabled:opacity-60"
              >
                {pending === "business" ? copy.redirecting : copy.subscribeBusiness}
              </button>
            </>
          ) : null}
          {hasCustomer ? (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void openPortal()}
              className="rounded-lg border border-[#C6C6CD] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#F8F9FF] disabled:opacity-60"
            >
              {pending === "portal" ? copy.redirecting : copy.manage}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-[12px] text-[#BEC6E0]">{copy.ownerOnly}</p>
      )}
      {error ? <p className="text-[12px] text-[#ff8a80]">{error}</p> : null}
      <Link href="/pricing" className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">
        {copy.viewPricing}
      </Link>
    </main>
  );
}
