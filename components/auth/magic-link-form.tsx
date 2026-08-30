"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { AuthIntent } from "@/lib/auth/return-to";
import { t } from "@/lib/i18n";
import { isValidEmail } from "@/lib/invoices/validate";

const RESEND_COOLDOWN_MS = 30_000;

export type AuthMode = "signin" | "register";

type MagicLinkFormProps = {
  intent?: AuthIntent;
  initialMode?: AuthMode;
  showModeToggle?: boolean;
};

export function MagicLinkForm({
  intent = "login",
  initialMode = "signin",
  showModeToggle = false,
}: MagicLinkFormProps) {
  const copy = t("auth");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [method, setMethod] = useState<"link" | "password">("link");
  const [screen, setScreen] = useState<"form" | "inbox">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendUntil, setResendUntil] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (screen !== "inbox") {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  const remainingCooldown = Math.max(0, Math.ceil((resendUntil - now) / 1000));
  const isRegister = mode === "register";

  async function signInWithPassword() {
    if (busy) {
      return;
    }
    if (!isValidEmail(email) || password.length < 12) {
      setEmailError(copy.passwordFailed);
      return;
    }
    setBusy(true);
    setEmailError(null);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setEmailError(payload.error ?? copy.passwordFailed);
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setEmailError(copy.passwordFailed);
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    if (busy) {
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError(copy.invalidEmail);
      return;
    }
    setBusy(true);
    setEmailError(null);
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setEmailError(payload.error ?? copy.sendFailed);
        return;
      }
      setResendUntil(Date.now() + RESEND_COOLDOWN_MS);
      setNow(Date.now());
      setScreen("inbox");
    } catch {
      setEmailError(copy.sendFailed);
    } finally {
      setBusy(false);
    }
  }

  if (screen === "inbox") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[28px] font-bold leading-9 tracking-[-0.4px] text-puyer-ink">{copy.checkInbox}</h1>
        <p className="text-[14px] leading-5 text-puyer-muted">
          {copy.inboxBody} <span className="font-semibold text-puyer-ink">{email}</span>
        </p>
        <p className="text-[14px] leading-5 text-puyer-muted">{copy.inboxHint}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded border border-puyer-border py-[9px] text-[12px] font-semibold tracking-[0.6px] text-puyer-ink"
            onClick={() => {
              setScreen("form");
              setEmailError(null);
            }}
          >
            {copy.changeEmail}
          </button>
          <button
            type="button"
            disabled={remainingCooldown > 0 || busy}
            className="flex-1 rounded bg-puyer-green py-[9px] text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-50"
            onClick={() => {
              if (remainingCooldown > 0) {
                return;
              }
              setNow(Date.now());
              void sendMagicLink();
            }}
          >
            {remainingCooldown > 0 ? `${copy.resend} (${remainingCooldown}s)` : copy.resend}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isRegister && method === "password") {
          void signInWithPassword();
          return;
        }
        void sendMagicLink();
      }}
    >
      {showModeToggle ? (
        <div className="grid grid-cols-2 rounded-full border border-puyer-border p-1 text-[12px] font-semibold tracking-[0.6px]">
          <button
            type="button"
            className={`rounded-full py-2 ${mode === "signin" ? "bg-puyer-ink text-white" : "text-puyer-muted"}`}
            aria-pressed={mode === "signin"}
            onClick={() => setMode("signin")}
          >
            {copy.signInTab}
          </button>
          <button
            type="button"
            className={`rounded-full py-2 ${mode === "register" ? "bg-puyer-ink text-white" : "text-puyer-muted"}`}
            aria-pressed={mode === "register"}
            onClick={() => setMode("register")}
          >
            {copy.registerTab}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-9 tracking-[-0.4px] text-puyer-ink">
          {isRegister ? copy.createAccount : copy.signIn}
        </h1>
        <p className="text-[14px] leading-5 text-puyer-muted">
          {isRegister ? copy.registerHint : copy.magicLinkHint}
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[16px] font-bold leading-6 text-puyer-ink">{copy.email}</span>
        <input
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
          }}
          className="rounded border border-puyer-border bg-puyer-card px-[9px] py-[11px] text-[16px] text-puyer-ink"
          placeholder={copy.emailPlaceholder}
        />
        {emailError ? <span className="text-[12px] text-[#b91c1c]">{emailError}</span> : null}
      </label>

      {!isRegister && method === "password" ? (
        <label className="flex flex-col gap-1">
          <span className="text-[16px] font-bold leading-6 text-puyer-ink">{copy.password}</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setEmailError(null);
            }}
            className="rounded border border-puyer-border bg-puyer-card px-[9px] py-[11px] text-[16px] text-puyer-ink"
            placeholder={copy.passwordPlaceholder}
          />
        </label>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded bg-puyer-green py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-50"
      >
        {busy
          ? copy.sending
          : isRegister
            ? copy.register
            : method === "password"
              ? copy.continuePassword
              : copy.continueEmail}
      </button>
      {!isRegister ? (
        <button
          type="button"
          className="text-[12px] font-semibold text-puyer-ink underline-offset-2 hover:underline"
          onClick={() => {
            setMethod(method === "password" ? "link" : "password");
            setEmailError(null);
          }}
        >
          {method === "password" ? copy.useMagicLink : copy.usePassword}
        </button>
      ) : null}
      <p className="text-[12px] leading-4 text-puyer-muted">
        {copy.legalLead}{" "}
        <Link href="/terms" className="font-medium text-puyer-ink underline-offset-2 hover:underline">
          {copy.terms}
        </Link>{" "}
        {copy.legalAnd}{" "}
        <Link href="/privacy" className="font-medium text-puyer-ink underline-offset-2 hover:underline">
          {copy.privacy}
        </Link>
        .
      </p>
    </form>
  );
}
