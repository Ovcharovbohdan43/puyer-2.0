import type { ReactNode } from "react";

import { t } from "@/lib/i18n";

type SpinnerTone = "brand" | "inherit";

type PuyerSpinnerProps = {
  size?: number;
  className?: string;
  tone?: SpinnerTone;
  label?: string;
};

export function PuyerSpinner({ size = 28, className = "", tone = "brand", label }: PuyerSpinnerProps) {
  const copy = label === undefined ? t("header").loading : label;
  const decorative = copy === "";
  const toneClass = tone === "inherit" ? " puyer-spinner--inherit" : "";
  return (
    <svg
      className={`puyer-spinner${toneClass}${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={decorative ? undefined : "status"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : copy}
    >
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.18" />
      <circle
        cx="16"
        cy="16"
        r="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="18 58"
      />
    </svg>
  );
}

export function PuyerPendingLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <PuyerSpinner size={16} tone="inherit" label="" />
      <span>{children}</span>
    </span>
  );
}

export function PuyerBusyText({
  busy,
  busyLabel,
  idle,
}: {
  busy: boolean;
  busyLabel: string;
  idle: string;
}) {
  if (!busy) {
    return idle;
  }
  return <PuyerPendingLabel>{busyLabel}</PuyerPendingLabel>;
}

export function PuyerRouteLoading() {
  return (
    <div className="puyer-loading">
      <PuyerSpinner size={40} />
    </div>
  );
}
