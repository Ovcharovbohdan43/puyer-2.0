"use client";

import { useState } from "react";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { dash as ui } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";

type StripeSettingsProps = {
  isOwner: boolean;
  status: string;
  chargesEnabled: boolean;
  canConnect: boolean;
  embedded?: boolean;
};

export function StripeSettings({ isOwner, status, chargesEnabled, canConnect, embedded = false }: StripeSettingsProps) {
  const copy = t("connect");
  const dash = t("dashboard");
  const billing = t("billing");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const label =
    status === "CONNECTED"
      ? copy.statusConnected
      : status === "ACTION_REQUIRED"
        ? copy.statusActionRequired
        : status === "CONNECTING"
          ? copy.statusConnecting
          : status === "DISCONNECTED"
            ? copy.statusDisconnected
            : copy.statusNotConnected;

  async function onboard() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "US" }),
      });
      const body = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error || copy.connectFailed);
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError(copy.connectFailed);
    } finally {
      setPending(false);
    }
  }

  async function disconnect() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/connect/disconnect", { method: "POST" });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(body.error || copy.disconnectFailed);
        return;
      }
      window.location.assign("/settings");
    } catch {
      setError(copy.disconnectFailed);
    } finally {
      setPending(false);
      setConfirmDisconnect(false);
    }
  }

  const inner = (
    <>
      {embedded ? null : <p className="text-[12px] font-semibold text-[#006C49]">{dash.nav.settings}</p>}
      <h2 className={embedded ? "text-[18px] font-semibold text-[#111827]" : "text-[24px] leading-8 font-semibold text-[#111827]"}>
        {copy.title}
      </h2>
      <p className="text-[14px] leading-5 text-[#6B7280]">{copy.body}</p>
      <p className="text-[14px] text-[#111827]">
        {label}
        {status === "CONNECTED" && chargesEnabled ? ` · ${copy.chargesEnabled}` : ""}
      </p>
      {isOwner ? (
        !canConnect && status !== "CONNECTED" && status !== "ACTION_REQUIRED" && status !== "CONNECTING" ? (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-[#6B7280]">{billing.upgradeForPayments}</p>
            <a href="/billing" className={`${ui.btnPrimary} w-fit`}>
              {billing.upgradeToPro}
            </a>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {status !== "CONNECTED" ? (
              <button type="button" disabled={pending} onClick={() => void onboard()} className={`${ui.btnPrimary} disabled:opacity-60`}>
                {pending ? copy.connecting : copy.connect}
              </button>
            ) : null}
            {status === "CONNECTED" || status === "ACTION_REQUIRED" || status === "CONNECTING" ? (
              confirmDisconnect ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void disconnect()}
                    className="rounded-lg bg-[#b42318] px-4 py-2 text-[14px] font-semibold text-white"
                  >
                    {copy.disconnectConfirm}
                  </button>
                  <button type="button" onClick={() => setConfirmDisconnect(false)} className={ui.btnSecondary}>
                    {copy.disconnectCancel}
                  </button>
                </div>
              ) : (
                <button type="button" disabled={pending} onClick={() => setConfirmDisconnect(true)} className={ui.btnSecondary}>
                  {copy.disconnect}
                </button>
              )
            ) : null}
          </div>
        )
      ) : (
        <p className="text-[12px] text-[#6B7280]">{copy.ownerOnly}</p>
      )}
      {error ? <p className="text-[12px] text-[#DC2626]">{error}</p> : null}
      {embedded ? null : <SignOutButton className="text-[13px] font-medium text-[#6B7280]" />}
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-4">{inner}</div>;
  }

  return <main className={`${ui.page} mx-auto flex max-w-xl flex-col gap-6 px-6 py-16`}>{inner}</main>;
}
