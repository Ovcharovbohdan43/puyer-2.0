"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { PuyerLogo } from "@/components/brand/puyer-logo";
import { FigmaIcon } from "@/components/marketing/figma-icon";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";
import { FOOTER_NAV, isNavActive, planCopyKey, SIDEBAR_NAV } from "@/lib/dashboard/nav";

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
    <aside className="fixed top-0 left-0 z-30 hidden h-dvh w-[260px] flex-col border-r border-[#E5E7EB] bg-[#FBFCFB] p-4 lg:flex">
      <div className="px-2 pb-8">
        <Link href="/dashboard" className="inline-flex items-center">
          <PuyerLogo height={28} />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {SIDEBAR_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium ${
                active ? dash.navActive : dash.navIdle
              }`}
            >
              <FigmaIcon src={item.icon} alt="" width={18} height={18} />
              {copy.nav[item.id]}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-1 border-t border-[#E5E7EB] pt-4">
        {FOOTER_NAV.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium ${
              isNavActive(pathname, item.href) ? dash.navActive : dash.navIdle
            }`}
          >
            <FigmaIcon src={item.icon} alt="" width={18} height={18} />
            {copy.nav[item.id]}
          </Link>
        ))}
        <div className="mt-4 flex items-center gap-3 px-2">
          <div
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF] text-[13px] font-semibold text-[#006C49]"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#111827]">{displayName}</p>
            <p className="text-[12px] text-[#6B7280]">{planLabel}</p>
          </div>
        </div>
        <Link href="/invoices/new" className={`${dash.btnPrimary} mt-3 w-full`}>
          {copy.newInvoice}
        </Link>
        <SignOutButton className="px-2 py-2 text-left text-[13px] font-medium text-[#6B7280] hover:text-[#111827]" />
      </div>
    </aside>
  );
}
