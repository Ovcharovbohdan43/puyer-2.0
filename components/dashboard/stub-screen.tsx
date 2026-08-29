import Link from "next/link";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";

type StubScreenProps = {
  title: string;
  body: string;
  showSignOut?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  showPhaseLabel?: boolean;
};

export function StubScreen({
  title,
  body,
  showSignOut = false,
  ctaHref,
  ctaLabel,
  showPhaseLabel = true,
}: StubScreenProps) {
  const copy = t("dashboard");
  return (
    <main className={`${dash.page} mx-auto flex max-w-lg flex-col gap-4 px-6 py-16`}>
      {showPhaseLabel ? <p className="text-[12px] font-semibold text-[#006C49]">{copy.phaseSoonTitle}</p> : null}
      <h1 className="text-[24px] leading-8 font-semibold text-[#111827]">{title}</h1>
      <p className="text-[14px] leading-5 text-[#6B7280]">{body}</p>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className={dash.link}>
          {ctaLabel}
        </Link>
      ) : null}
      <Link href="/dashboard" className={dash.link}>
        {copy.backToDashboard}
      </Link>
      {showSignOut ? <SignOutButton className="text-[13px] font-medium text-[#6B7280]" /> : null}
    </main>
  );
}
