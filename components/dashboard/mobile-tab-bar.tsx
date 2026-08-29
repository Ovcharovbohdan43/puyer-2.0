"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppNavIcon, type AppNavIconId } from "@/components/dashboard/nav-icons";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
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
            className="absolute inset-0 bg-black/40"
            aria-label={copy.addClientClose}
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute right-0 bottom-16 left-0 mx-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
            {MORE_LINKS.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium ${
                    active ? "bg-[#E8F5EF] text-[#006C49]" : "text-[#374151]"
                  }`}
                  onClick={() => setMoreOpen(false)}
                >
                  <AppNavIcon id={item.id as AppNavIconId} active={active} size={18} />
                  {copy.nav[item.id]}
                </Link>
              );
            })}
            <SignOutButton
              withIcon
              className="mt-1 inline-flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#4B5563]"
            />
          </div>
        </div>
      ) : null}
      <nav className="fixed right-0 bottom-0 left-0 z-30 flex border-t border-[#E5E7EB] bg-white lg:hidden">
        {MOBILE_PRIMARY_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
                active ? "text-[#006C49]" : "text-[#4B5563]"
              }`}
            >
              <AppNavIcon id={item.id} active={active} size={20} />
              {copy.nav[item.id]}
            </Link>
          );
        })}
        <button
          type="button"
          className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
            moreOpen || moreActive ? "text-[#006C49]" : "text-[#4B5563]"
          }`}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <AppNavIcon id="more" active={moreOpen || moreActive} size={20} />
          {copy.nav.more}
        </button>
      </nav>
    </>
  );
}
