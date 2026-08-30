"use client";

import { useFormStatus } from "react-dom";

import { PuyerBusyText } from "@/components/brand/puyer-spinner";

export function ConfirmContinueButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#006C49] text-[15px] font-semibold text-white disabled:opacity-60"
    >
      <PuyerBusyText busy={pending} busyLabel={pendingLabel} idle={label} />
    </button>
  );
}
