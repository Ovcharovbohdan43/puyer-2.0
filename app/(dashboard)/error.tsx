"use client";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
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
    <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{copy.pageErrorTitle}</h1>
      <p className="text-[14px] leading-5 text-[#BEC6E0]">{copy.pageErrorBody}</p>
      {error.digest ? <p className="text-[12px] text-[#BEC6E0]">Error {error.digest}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-[#6FFBBE] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0B1320]"
        >
          {copy.pageErrorRetry}
        </button>
        <SignOutButton className="rounded-lg border border-[#C6C6CD] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#BEC6E0]" />
      </div>
    </main>
  );
}
