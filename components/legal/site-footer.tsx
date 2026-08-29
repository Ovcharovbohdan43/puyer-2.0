"use client";

import Link from "next/link";

import { PuyerLogo } from "@/components/brand/puyer-logo";
import { FigmaIcon } from "@/components/marketing/figma-icon";
import { openCookiePreferences } from "@/lib/cookies/consent";
import { t } from "@/lib/i18n";

export function SiteFooter() {
  const footer = t("footer");

  return (
    <footer className="w-full bg-[#131b2e]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-10">
        <div className="col-span-2 flex flex-col gap-4">
          <PuyerLogo height={36} onDark />
          <p className="max-w-[320px] text-[14px] leading-5 text-[#eaf1ff] opacity-80">{footer.tagline}</p>
          <a href="https://puyer.org" className="landing-btn landing-btn--nav w-fit opacity-80" aria-label={footer.brand}>
            <FigmaIcon src="/landing/social.svg" alt="" width={20} height={20} />
          </a>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold tracking-[0.6px] text-white">{footer.product}</p>
          <ul className="flex flex-col gap-1 text-[14px] leading-5 text-[#eaf1ff] opacity-80">
            <li>
              <Link className="landing-btn landing-btn--nav" href="/#features">
                {footer.features}
              </Link>
            </li>
            <li>
              <Link className="landing-btn landing-btn--nav" href="/pricing">
                {footer.pricing}
              </Link>
            </li>
            <li>
              <Link className="landing-btn landing-btn--nav" href="/#templates">
                {footer.templates}
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold tracking-[0.6px] text-white">{footer.company}</p>
          <ul className="flex flex-col gap-1 text-[14px] leading-5 text-[#eaf1ff] opacity-80">
            <li>
              <Link className="landing-btn landing-btn--nav" href="/help">
                {footer.help}
              </Link>
            </li>
            <li>
              <a className="landing-btn landing-btn--nav" href={`mailto:${footer.contactEmail}`}>
                {footer.contact}
              </a>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-semibold tracking-[0.6px] text-white">{footer.legal}</p>
          <ul className="flex flex-col gap-1 text-[14px] leading-5 text-[#eaf1ff] opacity-80">
            <li>
              <Link className="landing-btn landing-btn--nav" href="/privacy">
                {footer.privacy}
              </Link>
            </li>
            <li>
              <Link className="landing-btn landing-btn--nav" href="/terms">
                {footer.terms}
              </Link>
            </li>
            <li>
              <Link className="landing-btn landing-btn--nav" href="/cookies">
                {footer.cookies}
              </Link>
            </li>
            <li>
              <button
                type="button"
                className="landing-btn landing-btn--nav text-left"
                onClick={() => openCookiePreferences()}
              >
                {footer.cookieSettings}
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#565e74] py-4 opacity-50">
        <p className="text-center text-[14px] leading-5 text-[#eaf1ff]">{footer.copyright}</p>
      </div>
    </footer>
  );
}
