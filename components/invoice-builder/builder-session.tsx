"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  createDefaultBuilderState,
  isBuilderDirty,
  type BuilderState,
  type InvoiceTemplate,
} from "@/components/invoice-builder/types";
import { Modal } from "@/components/ui/modal";
import { createBrowserSupabaseClient } from "@/lib/auth/browser";
import type { AuthIntent } from "@/lib/auth/return-to";
import { t } from "@/lib/i18n";
import { isValidEmail } from "@/lib/invoices/validate";

export type { AuthIntent };
type AuthScreen = "closed" | "form" | "inbox";

const RESEND_COOLDOWN_MS = 30_000;

type BuilderSessionValue = {
  authenticated: boolean;
  state: BuilderState;
  setState: (updater: BuilderState | ((current: BuilderState) => BuilderState)) => void;
  dirty: boolean;
  discardAndReset: () => void;
  applyTemplate: (template: InvoiceTemplate) => void;
  startInvoice: () => void;
  scrollToBuilder: () => void;
  openAuth: (intent: AuthIntent) => void;
  requestNavigate: (href: string) => void;
  persist?: () => Promise<{ id: string; invoiceNumber: string; publicId: string } | null>;
  persisting?: boolean;
  publicUrl?: string | null;
  invoiceId?: string | null;
  onCopyPublicLink?: () => void;
};

const BuilderSessionContext = createContext<BuilderSessionValue | null>(null);

export { BuilderSessionContext };

export function useBuilderSession() {
  const value = useContext(BuilderSessionContext);
  if (!value) {
    throw new Error("useBuilderSession must be used within PublicSession");
  }
  return value;
}

export function PublicSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const copy = t("auth");
  const leave = t("leave");

  const [baseline, setBaseline] = useState(createDefaultBuilderState);
  const [state, setStateRaw] = useState<BuilderState>(createDefaultBuilderState);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>(() =>
    searchParams.get("login") === "1" ? "form" : "closed",
  );
  const [authIntent, setAuthIntent] = useState<AuthIntent>("login");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [resendUntil, setResendUntil] = useState(0);
  const [resendNow, setResendNow] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);

  const dirty = isBuilderDirty(state, baseline);

  const setState = useCallback((updater: BuilderState | ((current: BuilderState) => BuilderState)) => {
    setStateRaw((current) => (typeof updater === "function" ? updater(current) : updater));
  }, []);

  const discardAndReset = useCallback(() => {
    const next = createDefaultBuilderState();
    setBaseline(next);
    setStateRaw(next);
  }, []);

  const scrollToBuilder = useCallback(() => {
    const el = document.getElementById("builder");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      document.getElementById("invoice-business-name")?.focus();
    }, 450);
  }, []);

  const startInvoice = useCallback(() => {
    if (authenticated) {
      router.push("/invoices/new");
      return;
    }
    if (pathname === "/") {
      scrollToBuilder();
      return;
    }
    router.push("/#builder");
  }, [authenticated, pathname, router, scrollToBuilder]);

  const applyTemplate = useCallback((template: InvoiceTemplate) => {
    setStateRaw((current) => ({ ...current, template }));
    if (pathname === "/") {
      scrollToBuilder();
    } else {
      router.push("/#builder");
    }
  }, [pathname, router, scrollToBuilder]);

  const navigateNow = useCallback(
    (href: string) => {
      if (href.startsWith("#")) {
        if (pathname !== "/") {
          router.push(`/${href}`);
          return;
        }
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (href === "/" && pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (href.startsWith("/#")) {
        if (pathname === "/") {
          const hash = href.slice(1);
          document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
          if (hash === "#builder") {
            window.setTimeout(() => document.getElementById("invoice-business-name")?.focus(), 450);
          }
          return;
        }
        router.push(href);
        return;
      }
      router.push(href);
    },
    [pathname, router],
  );

  const leavesBuilder = useCallback(
    (href: string) => {
      if (pathname !== "/") {
        return false;
      }
      if (href.startsWith("#") || href.startsWith("/#")) {
        return false;
      }
      if (href === "/" || href === "") {
        return false;
      }
      return true;
    },
    [pathname],
  );

  const requestNavigate = useCallback(
    (href: string) => {
      if (dirty && leavesBuilder(href)) {
        setLeaveHref(href);
        return;
      }
      navigateNow(href);
    },
    [dirty, leavesBuilder, navigateNow],
  );

  const openAuth = useCallback((intent: AuthIntent) => {
    setAuthIntent(intent);
    setEmailError(null);
    setAuthScreen("form");
  }, []);

  const closeAuth = useCallback(() => {
    if (authBusy) {
      return;
    }
    setAuthScreen("closed");
  }, [authBusy]);

  const sendMagicLink = useCallback(async () => {
    if (authBusy) {
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError(copy.invalidEmail);
      return;
    }
    setAuthBusy(true);
    setEmailError(null);
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intent: authIntent }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setEmailError(payload.error ?? copy.sendFailed);
        return;
      }
      setResendUntil(Date.now() + RESEND_COOLDOWN_MS);
      setResendNow(Date.now());
      setAuthScreen("inbox");
    } catch {
      setEmailError(copy.sendFailed);
    } finally {
      setAuthBusy(false);
    }
  }, [authBusy, authIntent, copy.invalidEmail, copy.sendFailed, email]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authScreen !== "inbox") {
      return;
    }
    const id = window.setInterval(() => setResendNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [authScreen]);

  const remainingCooldown = Math.max(0, Math.ceil((resendUntil - resendNow) / 1000));

  const value = useMemo<BuilderSessionValue>(
    () => ({
      authenticated,
      state,
      setState,
      dirty,
      discardAndReset,
      applyTemplate,
      startInvoice,
      scrollToBuilder,
      openAuth,
      requestNavigate,
    }),
    [applyTemplate, authenticated, dirty, discardAndReset, openAuth, requestNavigate, scrollToBuilder, setState, startInvoice, state],
  );

  const authTitle =
    authScreen === "inbox"
      ? copy.checkInbox
      : authIntent === "login"
        ? copy.signIn
        : copy.invoiceReady;

  return (
    <BuilderSessionContext.Provider value={value}>
      {children}

      <Modal
        open={leaveHref !== null}
        title={leave.title}
        closeOnOverlay
        onClose={() => setLeaveHref(null)}
      >
        <p className="text-[14px] leading-5 text-[#45464d]">{leave.body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded bg-black py-[9px] text-[12px] font-semibold tracking-[0.6px] text-white"
            onClick={() => setLeaveHref(null)}
          >
            {leave.continueEditing}
          </button>
          <button
            type="button"
            className="flex-1 rounded border border-[#e2e8f0] py-[9px] text-[12px] font-semibold tracking-[0.6px] text-black"
            onClick={() => {
              const href = leaveHref;
              setLeaveHref(null);
              discardAndReset();
              if (href) {
                navigateNow(href);
              }
            }}
          >
            {leave.leave}
          </button>
        </div>
      </Modal>

      <Modal
        open={authScreen !== "closed"}
        title={authTitle}
        onClose={closeAuth}
        header={
          authIntent !== "login" ? (
            <div className="flex items-center justify-center bg-[#ebf1fa] px-6 py-8">
              {/* Figma export from node 22020:2358 — visual header only */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/invoice-ready.png"
                alt=""
                width={160}
                height={160}
                className="size-40 object-contain"
              />
            </div>
          ) : null
        }
      >
        {authScreen === "inbox" ? (
          <div className="flex flex-col gap-4">
            <p className="text-[14px] leading-5 text-[#45464d]">
              {copy.inboxBody} <span className="font-semibold text-black">{email}</span>
            </p>
            <p className="text-[14px] leading-5 text-[#45464d]">{copy.inboxHint}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded border border-[#e2e8f0] py-[9px] text-[12px] font-semibold tracking-[0.6px] text-black"
                onClick={() => {
                  setAuthScreen("form");
                  setEmailError(null);
                }}
              >
                {copy.changeEmail}
              </button>
              <button
                type="button"
                disabled={remainingCooldown > 0 || authBusy}
                className="flex-1 rounded bg-black py-[9px] text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-50"
                onClick={() => {
                  if (remainingCooldown > 0) {
                    return;
                  }
                  setResendNow(Date.now());
                  void sendMagicLink();
                }}
              >
                {remainingCooldown > 0 ? `${copy.resend} (${remainingCooldown}s)` : copy.resend}
              </button>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMagicLink();
            }}
          >
            {authIntent !== "login" ? (
              <>
                <p className="text-[14px] leading-5 text-[#45464d]">{copy.requireAccount}</p>
                <ul className="flex flex-col gap-1 text-[14px] leading-5 text-[#45464d]">
                  {copy.benefits.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <label className="flex flex-col gap-1">
              <span className="text-[16px] font-bold leading-6 text-[#0b1c30]">{copy.email}</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(null);
                }}
                className="rounded border border-[#e2e8f0] bg-white px-[9px] py-[11px] text-[16px] text-black"
                placeholder={copy.emailPlaceholder}
              />
              {emailError ? <span className="text-[12px] text-[#b91c1c]">{emailError}</span> : null}
            </label>
            {authIntent !== "login" ? (
              <>
                <button
                  type="submit"
                  disabled={authBusy}
                  className="rounded bg-[#006c49] py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-50"
                >
                  {authBusy ? copy.sending : copy.register}
                </button>
                <button
                  type="button"
                  disabled={authBusy}
                  className="rounded border border-black py-[9px] text-[12px] font-semibold tracking-[0.6px] text-black disabled:opacity-50"
                  onClick={() => void sendMagicLink()}
                >
                  {authBusy ? copy.sending : copy.logIn}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={authBusy}
                className="rounded bg-[#006c49] py-3 text-[12px] font-semibold tracking-[0.6px] text-white disabled:opacity-50"
              >
                {authBusy ? copy.sending : copy.continueEmail}
              </button>
            )}
            <button
              type="button"
              className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]"
              onClick={closeAuth}
            >
              {copy.cancel}
            </button>
          </form>
        )}
      </Modal>
    </BuilderSessionContext.Provider>
  );
}
