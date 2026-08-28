"use client";

import { useState } from "react";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { t } from "@/lib/i18n";

type StripeSettingsProps = {
  isOwner: boolean;
  status: string;
  chargesEnabled: boolean;
  canConnect: boolean;
};

export function StripeSettings({ isOwner, status, chargesEnabled, canConnect }: StripeSettingsProps) {
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

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <p className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">{dash.nav.settings}</p>
      <h1 className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{copy.title}</h1>
      <p className="text-[14px] leading-5 text-[#BEC6E0]">{copy.body}</p>
      <p className="text-[14px] text-[#F8F9FF]">
        {label}
        {status === "CONNECTED" && chargesEnabled ? ` · ${copy.chargesEnabled}` : ""}
      </p>
      {isOwner ? (
        !canConnect && status !== "CONNECTED" && status !== "ACTION_REQUIRED" && status !== "CONNECTING" ? (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] text-[#BEC6E0]">{billing.upgradeForPayments}</p>
            <a
              href="/billing"
              className="inline-flex w-fit rounded-lg bg-[#6FFBBE] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0B1320]"
            >
              {billing.upgradeToPro}
            </a>
          </div>
        ) : (
        <div className="flex flex-wrap gap-3">
          {status !== "CONNECTED" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void onboard()}
              className="rounded-lg bg-[#6FFBBE] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0B1320] disabled:opacity-60"
            >
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
                  className="rounded-lg bg-[#b42318] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-white"
                >
                  {copy.disconnectConfirm}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(false)}
                  className="rounded-lg border border-[#C6C6CD] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#F8F9FF]"
                >
                  {copy.disconnectCancel}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmDisconnect(true)}
                className="rounded-lg border border-[#C6C6CD] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#F8F9FF]"
              >
                {copy.disconnect}
              </button>
            )
          ) : null}
        </div>
        )
      ) : (
        <p className="text-[12px] text-[#BEC6E0]">{copy.ownerOnly}</p>
      )}
      {error ? <p className="text-[12px] text-[#ff8a80]">{error}</p> : null}
      <SignOutButton className="text-[12px] font-semibold tracking-[0.6px] text-[#BEC6E0]" />
    </main>
  );
}
