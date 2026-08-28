"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { FigmaIcon } from "@/components/marketing/figma-icon";
import { t } from "@/lib/i18n";
import { isNavActive, MOBILE_PRIMARY_NAV, MORE_LINKS } from "@/lib/dashboard/nav";

export function MobileTabBar() {
  const pathname = usePathname();
  const copy = t("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_LINKS.some((item) => isNavActive(pathname, item.href));

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={copy.addClientClose}
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute right-0 bottom-16 left-0 mx-3 rounded-xl border border-[#C6C6CD] bg-[#131B2E] p-3 shadow-[-4px_0_24px_rgba(0,0,0,0.1)]">
            {MORE_LINKS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-[12px] font-semibold tracking-[0.6px] ${
                  isNavActive(pathname, item.href) ? "bg-[#3F465C] text-[#6FFBBE]" : "text-[#BEC6E0]"
                }`}
                onClick={() => setMoreOpen(false)}
              >
                {copy.nav[item.id]}
              </Link>
            ))}
            <SignOutButton className="mt-1 w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold tracking-[0.6px] text-[#BEC6E0]" />
          </div>
        </div>
      ) : null}
      <nav className="fixed right-0 bottom-0 left-0 z-30 flex border-t border-[#C6C6CD] bg-[#131B2E] lg:hidden">
        {MOBILE_PRIMARY_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-[0.6px] ${
                active ? "text-[#6FFBBE]" : "text-[#BEC6E0]"
              }`}
            >
              <FigmaIcon src={item.icon} alt="" width={18} height={18} />
              {copy.nav[item.id]}
            </Link>
          );
        })}
        <button
          type="button"
          className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold tracking-[0.6px] ${
            moreOpen || moreActive ? "text-[#6FFBBE]" : "text-[#BEC6E0]"
          }`}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <FigmaIcon src="/app/select-chevron.svg" alt="" width={18} height={18} />
          {copy.nav.more}
        </button>
      </nav>
    </>
  );
}
