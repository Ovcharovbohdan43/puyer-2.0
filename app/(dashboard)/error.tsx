"use client";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = t("dashboard");

  return (
    <main className={`${dash.page} mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-16`}>
      <h1 className="text-[24px] leading-8 font-semibold text-[#111827]">{copy.pageErrorTitle}</h1>
      <p className="text-[14px] leading-5 text-[#6B7280]">{copy.pageErrorBody}</p>
      {error.digest ? <p className="text-[12px] text-[#6B7280]">Error {error.digest}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => reset()} className={dash.btnPrimary}>
          {copy.pageErrorRetry}
        </button>
        <SignOutButton className={dash.btnSecondary} />
      </div>
    </main>
  );
}
