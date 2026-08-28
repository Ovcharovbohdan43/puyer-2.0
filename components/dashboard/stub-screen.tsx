import Link from "next/link";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { t } from "@/lib/i18n";

type StubScreenProps = {
  title: string;
  body: string;
  showSignOut?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

export function StubScreen({ title, body, showSignOut = false, ctaHref, ctaLabel }: StubScreenProps) {
  const copy = t("dashboard");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-16">
      <p className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">{copy.phaseSoonTitle}</p>
      <h1 className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{title}</h1>
      <p className="text-[14px] leading-5 text-[#BEC6E0]">{body}</p>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">
          {ctaLabel}
        </Link>
      ) : null}
      <Link href="/dashboard" className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">
        {copy.backToDashboard}
      </Link>
      {showSignOut ? <SignOutButton className="text-[12px] font-semibold tracking-[0.6px] text-[#BEC6E0]" /> : null}
    </main>
  );
}
