"use client";

import Link from "next/link";
import { CookieIcon } from "@phosphor-icons/react/dist/ssr/Cookie";
import { useCallback, useEffect, useState } from "react";

import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_PREFERENCES_EVENT,
  type CookieConsent,
  defaultAcceptedConsent,
  defaultRejectedConsent,
  parseCookieConsent,
  serializeCookieConsent,
} from "@/lib/cookies/consent";
import { t } from "@/lib/i18n";

type PanelMode = "notice" | "customize";

function readStoredConsent(): CookieConsent | null {
  try {
    return parseCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

function persistConsent(consent: CookieConsent) {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serializeCookieConsent(consent));
}

export function CookieConsent() {
  const copy = t("cookies");
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PanelMode>("notice");
  const [draft, setDraft] = useState<CookieConsent>(() => defaultRejectedConsent());

  const showPreferences = useCallback(() => {
    const stored = readStoredConsent();
    setDraft(stored ?? defaultRejectedConsent());
    setMode("customize");
    setOpen(true);
  }, []);

  useEffect(() => {
    const stored = readStoredConsent();
    if (!stored) {
      setOpen(true);
      setMode("notice");
      setDraft(defaultRejectedConsent());
    }
    setReady(true);
    const onOpen = () => showPreferences();
    window.addEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
  }, [showPreferences]);

  function save(consent: CookieConsent) {
    persistConsent(consent);
    setDraft(consent);
    setOpen(false);
    setMode("notice");
  }

  if (!ready || !open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 sm:justify-end sm:p-6">
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-consent-title"
        className="pointer-events-auto w-full max-w-[440px] rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0px_20px_40px_-12px_rgba(15,23,42,0.28)]"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f5ef] text-[#006c49]">
            <CookieIcon size={22} weight="duotone" aria-hidden />
          </span>
          <div>
            <h2 id="cookie-consent-title" className="text-[18px] font-semibold leading-6 text-[#0b1c30]">
              {copy.title}
            </h2>
            <p className="mt-2 text-[14px] leading-5 text-[#45464d]">{copy.body}</p>
            <p className="mt-2 text-[13px] leading-5 text-[#45464d]">
              <Link href="/cookies" className="font-medium text-[#006c49] underline-offset-2 hover:underline">
                {copy.policy}
              </Link>
              {" · "}
              <Link href="/privacy" className="font-medium text-[#006c49] underline-offset-2 hover:underline">
                {copy.privacy}
              </Link>
            </p>
          </div>
        </div>

        {mode === "customize" ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-[14px] font-semibold text-[#0b1c30]">{copy.necessary}</span>
                <span className="mt-0.5 block text-[12px] leading-4 text-[#45464d]">{copy.necessaryHint}</span>
              </span>
              <input type="checkbox" checked disabled className="mt-1 size-4 accent-[#006c49]" />
            </label>
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-[14px] font-semibold text-[#0b1c30]">{copy.preferences}</span>
                <span className="mt-0.5 block text-[12px] leading-4 text-[#45464d]">{copy.preferencesHint}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#006c49]"
                checked={draft.preferences}
                onChange={(event) => setDraft({ ...draft, preferences: event.target.checked })}
              />
            </label>
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-[14px] font-semibold text-[#0b1c30]">{copy.analytics}</span>
                <span className="mt-0.5 block text-[12px] leading-4 text-[#45464d]">{copy.analyticsHint}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#006c49]"
                checked={draft.analytics}
                onChange={(event) => setDraft({ ...draft, analytics: event.target.checked })}
              />
            </label>
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-[14px] font-semibold text-[#0b1c30]">{copy.marketing}</span>
                <span className="mt-0.5 block text-[12px] leading-4 text-[#45464d]">{copy.marketingHint}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#006c49]"
                checked={draft.marketing}
                onChange={(event) => setDraft({ ...draft, marketing: event.target.checked })}
              />
            </label>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {mode === "customize" ? (
            <button
              type="button"
              className="flex-1 rounded-full bg-[#006c49] px-4 py-2.5 text-[12px] font-semibold tracking-[0.6px] text-white"
              onClick={() => save({ ...draft, necessary: true, updatedAt: new Date().toISOString() })}
            >
              {copy.save}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="flex-1 rounded-full bg-[#006c49] px-4 py-2.5 text-[12px] font-semibold tracking-[0.6px] text-white"
                onClick={() => save(defaultAcceptedConsent())}
              >
                {copy.accept}
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-[#0b1c30] bg-white px-4 py-2.5 text-[12px] font-semibold tracking-[0.6px] text-[#0b1c30]"
                onClick={() => save(defaultRejectedConsent())}
              >
                {copy.reject}
              </button>
            </>
          )}
          <button
            type="button"
            className="flex-1 rounded-full px-4 py-2.5 text-[12px] font-semibold tracking-[0.6px] text-[#006c49]"
            onClick={() => setMode(mode === "customize" ? "notice" : "customize")}
          >
            {mode === "customize" ? copy.back : copy.customize}
          </button>
        </div>
      </div>
    </div>
  );
}
