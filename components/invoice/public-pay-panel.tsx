"use client";

import { useState } from "react";

import { PuyerBusyText } from "@/components/brand/puyer-spinner";
import { t } from "@/lib/i18n";

type PublicPayPanelProps = {
  publicId: string;
  amountLabel: string;
  dueLabel: string | null;
  pdfHref: string;
  payable: boolean;
  connected: boolean;
  paid: boolean;
  hasBankTransfer?: boolean;
  checkout?: string | null;
};

export function PublicPayPanel({
  publicId,
  amountLabel,
  dueLabel,
  pdfHref,
  payable,
  connected,
  paid,
  hasBankTransfer = false,
  checkout,
}: PublicPayPanelProps) {
  const pay = t("pay");
  const connect = t("connect");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPay = payable && connected && !paid;

  async function startPay() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/invoices/${encodeURIComponent(publicId)}/pay`, {
        method: "POST",
      });
      const body = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !body.url) {
        setError(body.error || connect.payFailed);
        return;
      }
      window.location.assign(body.url);
    } catch {
      setError(connect.payFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="flex w-full flex-col gap-6 lg:sticky lg:top-6 lg:w-[391px] lg:shrink-0">
      <div className="flex flex-col gap-6 rounded-xl border border-puyer-border bg-puyer-card p-6 shadow-[0px_4px_6px_-1px_rgba(15,23,42,0.1),0px_2px_4px_-1px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-1">
          <p className="text-[14px] leading-5 text-puyer-muted">{pay.amountDue}</p>
          <p className="text-[40px] leading-[48px] font-bold tracking-[-1.2px] text-puyer-ink sm:text-[48px] sm:leading-[56px]">
            {amountLabel}
          </p>
          {paid ? (
            <p className="mt-1 text-[14px] leading-5 font-semibold text-puyer-green">{connect.alreadyPaid}</p>
          ) : dueLabel ? (
            <p className="mt-1 flex items-center gap-1 text-[14px] leading-5 text-[#F59E0B]">
              <ClockIcon />
              {dueLabel}
            </p>
          ) : null}
        </div>

        {checkout === "success" ? (
          <p className="text-[12px] leading-4 text-puyer-green">{connect.checkoutProcessing}</p>
        ) : null}
        {checkout === "cancel" ? (
          <p className="text-[12px] leading-4 text-puyer-muted">{connect.checkoutCanceled}</p>
        ) : null}

        <div className="flex flex-col gap-2">
          {canPay ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void startPay()}
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1e293b] text-[16px] leading-6 font-semibold text-[#f8f9ff] hover:bg-[#0f172a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e293b] disabled:cursor-wait disabled:opacity-60"
            >
              <PuyerBusyText busy={pending} busyLabel={connect.paying} idle={pay.payInvoice} />
              {pending ? null : <ArrowIcon />}
            </button>
          ) : paid ? null : hasBankTransfer ? (
            <p className="text-[14px] leading-5 text-puyer-muted">{pay.bankTransferHint}</p>
          ) : (
            <p className="text-[14px] leading-5 text-puyer-muted">{connect.payUnavailable}</p>
          )}
          <a
            href={pdfHref}
            className="flex h-[58px] w-full items-center justify-center gap-2 rounded-lg border border-puyer-border bg-puyer-card text-[16px] leading-6 font-medium text-puyer-ink hover:bg-puyer-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e293b]"
          >
            <DownloadIcon />
            {pay.downloadPdf}
          </a>
          {error ? <p className="text-[12px] leading-4 text-[#B42318]">{error}</p> : null}
        </div>
      </div>
      {canPay ? (
      <p className="flex items-center justify-center gap-1 px-0 py-2 text-[14px] leading-5 text-puyer-muted opacity-80">
        <LockIcon />
        {pay.stripeTrust}
      </p>
      ) : null}
    </aside>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="size-[14px] shrink-0">
      <circle cx="7" cy="7" r="5.25" stroke="#F59E0B" strokeWidth="1.25" />
      <path
        d="M7 4.25V7L8.75 8.2"
        stroke="#F59E0B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="size-[14px] shrink-0">
      <path d="M10.65 7.875H0V6.125H10.65L5.75 1.225L7 0L14 7L7 14L5.75 12.775L10.65 7.875Z" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="size-[14px] shrink-0">
      <path
        d="M7 10.5L2.625 6.125L3.85 4.856L6.125 7.131V0H7.875V7.131L10.15 4.856L11.375 6.125L7 10.5ZM1.75 14C1.269 14 0.857 13.829 0.514 13.486C0.171 13.143 0 12.731 0 12.25V9.625H1.75V12.25H12.25V9.625H14V12.25C14 12.731 13.829 13.143 13.486 13.486C13.143 13.829 12.731 14 12.25 14H1.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true" className="h-[14px] w-[11px] shrink-0">
      <path
        d="M1.375 14C1.003 14 0.685 13.87 0.421 13.609C0.157 13.349 0.026 13.035 0.026 12.667V6C0.026 5.632 0.157 5.318 0.421 5.057C0.685 4.797 1.003 4.667 1.375 4.667H2.063V3.333C2.063 2.411 2.388 1.625 3.038 0.974C3.688 0.325 4.475 0 5.5 0C6.525 0 7.312 0.325 7.962 0.974C8.612 1.625 8.938 2.411 8.938 3.333V4.667H9.625C9.997 4.667 10.315 4.797 10.579 5.057C10.843 5.318 10.974 5.632 10.974 6V12.667C10.974 13.035 10.843 13.349 10.579 13.609C10.315 13.87 9.997 14 9.625 14H1.375ZM1.375 12.667H9.625V6H1.375V12.667ZM5.5 10.667C5.872 10.667 6.19 10.537 6.454 10.276C6.718 10.016 6.849 9.701 6.849 9.333C6.849 8.965 6.718 8.651 6.454 8.39C6.19 8.13 5.872 8 5.5 8C5.128 8 4.81 8.13 4.546 8.39C4.282 8.651 4.151 8.965 4.151 9.333C4.151 9.701 4.282 10.016 4.546 10.276C4.81 10.537 5.128 10.667 5.5 10.667ZM3.438 4.667H7.563V3.333C7.563 2.778 7.368 2.306 6.979 1.917C6.59 1.528 6.118 1.333 5.5 1.333C4.882 1.333 4.41 1.528 4.021 1.917C3.632 2.306 3.438 2.778 3.438 3.333V4.667Z"
        fill="currentColor"
      />
    </svg>
  );
}
