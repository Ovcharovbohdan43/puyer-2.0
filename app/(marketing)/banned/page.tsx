import type { Metadata } from "next";
import Link from "next/link";

import { PuyerLogo } from "@/components/brand/puyer-logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { getSessionOrNull } from "@/lib/authorization";
import { findActiveBanForUser } from "@/lib/moderation/bans";
import { isBanInForce } from "@/lib/moderation/status";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Account restricted — Puyer",
  robots: { index: false, follow: false },
};

export default async function BannedPage() {
  const copy = t("ban");
  const session = await getSessionOrNull();
  const ban = session ? await findActiveBanForUser(session.id) : null;
  const active = ban && isBanInForce(ban) ? ban : null;

  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-6 py-16 text-[#0b1c30]">
      <PuyerLogo height={32} />
      <div className="mt-10 w-full max-w-lg">
        <h1 className="text-[28px] font-semibold leading-8 tracking-[-0.4px]">{copy.title}</h1>
        <p className="mt-3 text-[16px] leading-6 text-[#45464d]">{copy.lead}</p>
        {active ? (
          <>
            <p className="mt-6 text-[14px] font-semibold uppercase tracking-[0.6px] text-[#6B7280]">
              {active.kind === "PERMANENT" ? copy.permanent : copy.temporary}
            </p>
            {active.kind === "TEMPORARY" && active.endsAt ? (
              <p className="mt-1 text-[14px] text-[#45464d]">
                {copy.until.replace("{date}", active.endsAt.toISOString().slice(0, 10))}
              </p>
            ) : null}
            <p className="mt-4 whitespace-pre-wrap text-[16px] leading-6">{active.reason}</p>
          </>
        ) : (
          <p className="mt-6 text-[16px] leading-6 text-[#45464d]">{copy.checkEmail}</p>
        )}
        <p className="mt-6 text-[16px] leading-6 text-[#45464d]">{copy.next}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/help" className="rounded-lg bg-[#006c49] px-4 py-2.5 text-[14px] font-semibold text-white">
            {copy.help}
          </Link>
          <SignOutButton className="rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-[14px] font-medium text-[#0b1c30]" />
        </div>
      </div>
    </main>
  );
}
