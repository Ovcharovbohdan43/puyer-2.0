"use client";

import { useState } from "react";
import Link from "next/link";

import { PuyerBusyText } from "@/components/brand/puyer-spinner";
import { dash as ui } from "@/lib/dashboard/chrome";
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
    <main className={`${ui.page} mx-auto flex max-w-xl flex-col gap-6 px-6 py-16`}>
      <p className="text-[12px] font-semibold text-[#006C49]">{dash.nav.billing}</p>
      <h1 className="text-[24px] leading-8 font-semibold text-[#111827]">{copy.title}</h1>
      <p className="text-[14px] leading-5 text-[#6B7280]">{copy.body}</p>
      <div className={`${ui.card} flex flex-col gap-1 p-4`}>
        <p className="text-[16px] font-semibold text-[#111827]">{planLabel}</p>
        <p className="text-[14px] text-[#6B7280]">{statusLabel}</p>
        {periodEndLabel ? <p className="text-[12px] text-[#6B7280]">{periodEndLabel}</p> : null}
        {cancelAtPeriodEnd ? <p className="text-[12px] text-[#DC2626]">{copy.cancelScheduled}</p> : null}
      </div>
      {isOwner ? (
        <div className="flex flex-wrap gap-3">
          {canCheckout ? (
            <>
              <button type="button" disabled={pending !== null} onClick={() => void checkout("PRO")} className={`${ui.btnPrimary} disabled:opacity-60`}>
                <PuyerBusyText busy={pending === "pro"} busyLabel={copy.redirecting} idle={copy.subscribePro} />
              </button>
              <button type="button" disabled={pending !== null} onClick={() => void checkout("BUSINESS")} className={`${ui.btnSecondary} disabled:opacity-60`}>
                <PuyerBusyText busy={pending === "business"} busyLabel={copy.redirecting} idle={copy.subscribeBusiness} />
              </button>
            </>
          ) : null}
          {hasCustomer ? (
            <button type="button" disabled={pending !== null} onClick={() => void openPortal()} className={`${ui.btnSecondary} disabled:opacity-60`}>
              <PuyerBusyText busy={pending === "portal"} busyLabel={copy.redirecting} idle={copy.manage} />
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-[12px] text-[#6B7280]">{copy.ownerOnly}</p>
      )}
      {error ? <p className="text-[12px] text-[#DC2626]">{error}</p> : null}
      <Link href="/pricing" className={ui.link}>
        {copy.viewPricing}
      </Link>
    </main>
  );
}
