"use client";

import { useState } from "react";

import { PuyerLogo } from "@/components/brand/puyer-logo";
import { useBuilderSession } from "@/components/invoice-builder/builder-session";
import { t } from "@/lib/i18n";

export function PublicHeader() {
  const copy = t("header");
  const { authenticated, startInvoice, requestNavigate } = useBuilderSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: string) => {
    setMenuOpen(false);
    requestNavigate(href);
  };

  return (
    <header className="public-header sticky top-0 z-40 border-b border-[#e2e8f0]">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-10">
        <button
          type="button"
          className="inline-flex items-center"
          onClick={() => go("/")}
        >
          <PuyerLogo height={32} />
        </button>

        <nav className="hidden items-center gap-6 text-[14px] leading-5 lg:flex">
          <button type="button" className="landing-btn landing-btn--nav" onClick={() => go("/#features")}>
            {copy.features}
          </button>
          <button type="button" className="landing-btn landing-btn--nav" onClick={() => go("/#templates")}>
            {copy.templates}
          </button>
          <button type="button" className="landing-btn landing-btn--nav" onClick={() => go("/pricing")}>
            {copy.pricing}
          </button>
          <button type="button" className="landing-btn landing-btn--nav" onClick={() => go("/#faq")}>
            {copy.faq}
          </button>
          <button type="button" className="landing-btn landing-btn--nav" onClick={() => go("/help")}>
            {copy.help}
          </button>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {authenticated ? (
            <button
              type="button"
              className="landing-btn landing-btn--nav text-[12px] font-semibold tracking-[0.6px]"
              onClick={() => go("/dashboard")}
            >
              {copy.dashboard}
            </button>
          ) : (
            <button
              type="button"
              className="landing-btn landing-btn--nav text-[12px] font-semibold tracking-[0.6px]"
              onClick={() => go("/login")}
            >
              {copy.login}
            </button>
          )}
          <button
            type="button"
            className="landing-btn landing-btn--green rounded-full bg-[#006c49] px-5 py-2 text-[12px] font-semibold tracking-[0.6px] text-white"
            onClick={startInvoice}
          >
            {copy.createInvoice}
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className="landing-btn landing-btn--green rounded-full bg-[#006c49] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-white"
            onClick={() => {
              setMenuOpen(false);
              startInvoice();
            }}
          >
            {copy.createInvoice}
          </button>
          <button
            type="button"
            className="landing-btn landing-btn--ghost rounded border border-current px-3 py-2 text-[12px] font-semibold tracking-[0.6px]"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? copy.close : copy.menu}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#e2e8f0] bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-[14px] leading-5">
            <button type="button" className="landing-btn landing-btn--nav text-left" onClick={() => go("/#features")}>
              {copy.features}
            </button>
            <button type="button" className="landing-btn landing-btn--nav text-left" onClick={() => go("/#templates")}>
              {copy.templates}
            </button>
            <button type="button" className="landing-btn landing-btn--nav text-left" onClick={() => go("/pricing")}>
              {copy.pricing}
            </button>
            <button type="button" className="landing-btn landing-btn--nav text-left" onClick={() => go("/#faq")}>
              {copy.faq}
            </button>
            <button type="button" className="landing-btn landing-btn--nav text-left" onClick={() => go("/help")}>
              {copy.help}
            </button>
            {authenticated ? (
              <button type="button" className="landing-btn landing-btn--nav text-left" onClick={() => go("/dashboard")}>
                {copy.dashboard}
              </button>
            ) : (
              <button
                type="button"
                className="landing-btn landing-btn--nav text-left"
                onClick={() => go("/login")}
              >
                {copy.login}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
