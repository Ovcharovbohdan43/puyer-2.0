"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { FigmaIcon } from "@/components/marketing/figma-icon";
import { t } from "@/lib/i18n";
import { isNavActive, planCopyKey, SETTINGS_NAV, SIDEBAR_NAV } from "@/lib/dashboard/nav";

type SidebarProps = {
  displayName: string;
  plan: "FREE" | "PRO" | "BUSINESS";
};

export function Sidebar({ displayName, plan }: SidebarProps) {
  const pathname = usePathname();
  const copy = t("dashboard");
  const initial = displayName.trim().charAt(0).toUpperCase() || "P";
  const planLabel = copy[planCopyKey(plan)];

  return (
    <aside className="fixed top-0 left-0 z-30 hidden h-dvh w-[280px] flex-col border-r border-[#C6C6CD] bg-[#131B2E] p-4 lg:flex">
      <div className="px-2 pb-6">
        <Link href="/dashboard" className="text-[24px] leading-8 font-bold text-[#F8F9FF]">
          {copy.logo}
        </Link>
      </div>
      <div className="mb-8 flex items-center gap-4 px-2">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#3F465C] text-[14px] font-semibold text-[#6FFBBE]"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] leading-5 font-semibold text-[#BEC6E0]">{displayName}</p>
          <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-[#BEC6E0]">{planLabel}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {SIDEBAR_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-4 rounded-lg px-3 py-2 text-[12px] leading-4 font-semibold tracking-[0.6px] ${
                active ? "bg-[#3F465C] text-[#6FFBBE]" : "text-[#BEC6E0]"
              }`}
            >
              <FigmaIcon src={item.icon} alt="" width={18} height={18} />
              {copy.nav[item.id]}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-6">
        <Link
          href={SETTINGS_NAV.href}
          className={`flex items-center gap-4 rounded-lg px-3 py-2 text-[12px] leading-4 font-semibold tracking-[0.6px] ${
            isNavActive(pathname, SETTINGS_NAV.href) ? "bg-[#3F465C] text-[#6FFBBE]" : "text-[#BEC6E0]"
          }`}
        >
          <FigmaIcon src={SETTINGS_NAV.icon} alt="" width={20} height={20} />
          {copy.nav.settings}
        </Link>
        <Link
          href="/invoices/new"
          className="flex h-9 items-center justify-center rounded-lg bg-[#6FFBBE] text-[14px] leading-5 font-semibold text-[#002113]"
        >
          {copy.newInvoice}
        </Link>
        <SignOutButton className="px-2 text-left text-[12px] font-semibold tracking-[0.6px] text-[#BEC6E0] hover:text-[#F8F9FF]" />
      </div>
    </aside>
  );
}
