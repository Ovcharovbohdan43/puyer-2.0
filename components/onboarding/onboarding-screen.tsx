"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";

import { PuyerLogo } from "@/components/brand/puyer-logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { CURRENCIES } from "@/lib/invoices/currencies";
import { timezoneChoices } from "@/lib/onboarding/options";
import {
  ONBOARDING_ADDRESS_MAX,
  ONBOARDING_NAME_MAX,
} from "@/lib/onboarding/input";
import { t } from "@/lib/i18n";

export type OnboardingScreenProps = {
  isOwner: boolean;
  name: string;
  businessName: string;
  businessAddress: string;
  currency: string;
  taxRate: string;
  timezone: string;
  nextPath: string;
};

function FieldLabel({
  label,
  required,
  optional,
  hint,
  popoverId,
  popoverBody,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  popoverId?: string;
  popoverBody?: string;
}) {
  const copy = t("onboarding");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold tracking-[0.4px] text-[#374151]">{label}</span>
        {required ? (
          <span className="rounded-full bg-[#E8F5EF] px-2 py-0.5 text-[10px] font-semibold tracking-[0.4px] text-[#006C49]">
            {copy.required}
          </span>
        ) : null}
        {optional ? (
          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold tracking-[0.4px] text-[#6B7280]">
            {copy.optional}
          </span>
        ) : null}
        {popoverId && popoverBody ? (
          <>
            <button
              type="button"
              popoverTarget={popoverId}
              className="text-[11px] font-semibold text-[#006C49] underline-offset-2 hover:underline"
            >
              {copy.why}
            </button>
            <div
              id={popoverId}
              popover="auto"
              className="max-w-xs rounded-xl border border-[#E5E7EB] bg-white p-3 text-[13px] leading-5 text-[#374151] shadow-lg"
            >
              {popoverBody}
            </div>
          </>
        ) : null}
      </div>
      {hint ? <p className="text-[12px] leading-4 text-[#6B7280]">{hint}</p> : null}
    </div>
  );
}

function changeStep(next: number, apply: (value: number) => void) {
  const run = () => {
    flushSync(() => apply(next));
  };
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    document.startViewTransition(run);
    return;
  }
  apply(next);
}

export function OnboardingScreen({
  isOwner,
  name,
  businessName,
  businessAddress,
  currency,
  taxRate,
  timezone,
  nextPath,
}: OnboardingScreenProps) {
  const copy = t("onboarding");
  const total = isOwner ? 3 : 1;
  const [step, setStep] = useState(0);
  const [formName, setFormName] = useState(name);
  const [formTz, setFormTz] = useState(timezone || "UTC");
  const [formBusiness, setFormBusiness] = useState(businessName);
  const [formAddress, setFormAddress] = useState(businessAddress);
  const [formCurrency, setFormCurrency] = useState(currency || "USD");
  const [formTax, setFormTax] = useState(taxRate === "0" ? "" : taxRate);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const zones = useMemo(() => {
    const detected = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
    return timezoneChoices(detected);
  }, []);

  function validateStep(): boolean {
    if (step === 0 && formName.trim().length < 2) {
      setError("Enter your name.");
      return false;
    }
    if (isOwner && step === 1 && formBusiness.trim().length < 2) {
      setError("Enter your business name.");
      return false;
    }
    setError(null);
    return true;
  }

  function onNext() {
    if (!validateStep()) {
      return;
    }
    changeStep(Math.min(step + 1, total - 1), setStep);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateStep()) {
      return;
    }
    if (isOwner && step < total - 1) {
      onNext();
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          timezone: formTz,
          businessName: formBusiness,
          businessAddress: formAddress,
          currency: formCurrency,
          taxRate: formTax || "0",
          clientName,
          clientEmail,
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(body.error || copy.saveFailed);
        return;
      }
      window.location.assign(nextPath);
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-2 h-[42px] w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none focus:border-[#006C49]";

  let panel: ReactNode = null;
  if (step === 0) {
    panel = (
      <div className="flex flex-col gap-5">
        <label>
          <FieldLabel
            label={copy.yourName}
            required
            hint={copy.yourNameHint}
            popoverId="why-name"
            popoverBody={copy.whyName}
          />
          <input
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
            required
            maxLength={ONBOARDING_NAME_MAX}
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label>
          <FieldLabel label={copy.timezone} optional hint={copy.timezoneHint} />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <select
              value={formTz}
              onChange={(event) => setFormTz(event.target.value)}
              className={`${inputClass} mt-0 flex-1`}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="h-[42px] rounded-xl border border-[#E5E7EB] px-3 text-[12px] font-semibold text-[#111827]"
              onClick={() => setFormTz(Intl.DateTimeFormat().resolvedOptions().timeZone)}
            >
              {copy.useDeviceTz}
            </button>
          </div>
        </label>
      </div>
    );
  } else if (step === 1) {
    panel = (
      <div className="flex flex-col gap-5">
        <label>
          <FieldLabel
            label={copy.businessName}
            required
            hint={copy.businessNameHint}
            popoverId="why-biz"
            popoverBody={copy.whyBusiness}
          />
          <input
            value={formBusiness}
            onChange={(event) => setFormBusiness(event.target.value)}
            required
            maxLength={ONBOARDING_NAME_MAX}
            autoComplete="organization"
            className={inputClass}
          />
        </label>
        <label>
          <FieldLabel label={copy.address} optional hint={copy.addressHint} />
          <textarea
            value={formAddress}
            onChange={(event) => setFormAddress(event.target.value)}
            maxLength={ONBOARDING_ADDRESS_MAX}
            rows={3}
            className="onboarding-grow mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#111827] outline-none focus:border-[#006C49]"
          />
        </label>
      </div>
    );
  } else {
    panel = (
      <div className="flex flex-col gap-5">
        <label>
          <FieldLabel label={copy.currency} required hint={copy.currencyHint} />
          <select
            value={formCurrency}
            onChange={(event) => setFormCurrency(event.target.value)}
            className={inputClass}
          >
            {CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} · {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel label={copy.tax} optional hint={copy.taxHint} />
          <input
            inputMode="decimal"
            value={formTax}
            onChange={(event) => setFormTax(event.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </label>
        <label>
          <FieldLabel label={copy.clientName} optional hint={copy.clientHint} />
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            maxLength={ONBOARDING_NAME_MAX}
            className={inputClass}
          />
        </label>
        <label>
          <FieldLabel label={copy.clientEmail} optional />
          <input
            type="email"
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>
    );
  }

  const title = isOwner ? copy.title : copy.memberTitle;
  const subtitle = isOwner ? copy.subtitle : copy.memberSubtitle;
  const lastStep = step === total - 1;

  return (
    <main className="onboarding-shell min-h-dvh bg-[#F6F7F6] px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center">
            <PuyerLogo height={32} />
          </Link>
          <SignOutButton className="text-[12px] font-semibold text-[#6B7280]" />
        </header>

        <article className="onboarding-card rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.25)] sm:p-8">
          {isOwner ? (
            <p className="text-[12px] font-semibold tracking-[0.4px] text-[#006C49]">
              {copy.stepOf.replace("{current}", String(step + 1)).replace("{total}", String(total))}
            </p>
          ) : null}
          <h1 className="mt-2 text-[28px] leading-9 font-semibold tracking-[-0.4px] text-[#111827]">{title}</h1>
          <p className="mt-2 text-[14px] leading-6 text-[#6B7280]">{subtitle}</p>

          {isOwner ? (
            <ol className="mt-6 grid grid-cols-3 gap-2" aria-hidden>
              {[copy.stepYou, copy.stepBusiness, copy.stepInvoices].map((label, index) => (
                <li
                  key={label}
                  className={`rounded-full px-2 py-1 text-center text-[11px] font-semibold ${
                    index === step ? "bg-[#006C49] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                >
                  {label}
                </li>
              ))}
            </ol>
          ) : null}

          <form className="mt-6" onSubmit={(event) => void onSubmit(event)}>
            <div className="onboarding-panel">{panel}</div>
            {error ? <p className="mt-4 text-[14px] text-[#DC2626]">{error}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {step > 0 ? (
                <button
                  type="button"
                  className="h-11 rounded-xl border border-[#E5E7EB] px-5 text-[13px] font-semibold text-[#111827]"
                  onClick={() => changeStep(step - 1, setStep)}
                >
                  {copy.back}
                </button>
              ) : null}
              <button
                type="submit"
                disabled={pending}
                className="h-11 flex-1 rounded-xl bg-[#006C49] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {pending ? copy.saving : lastStep ? copy.finish : copy.continue}
              </button>
            </div>
          </form>
        </article>
      </div>
    </main>
  );
}
