import type { InvoiceStatus } from "@prisma/client";
import { t } from "@/lib/i18n";

type StatusPillProps = {
  status: InvoiceStatus;
  variant: "list" | "overview" | "drawer";
};

function pillKind(status: InvoiceStatus): "PAID" | "PENDING" | "OVERDUE" | "DRAFT" | "CANCELED" {
  if (status === "PAID") {
    return "PAID";
  }
  if (status === "OVERDUE") {
    return "OVERDUE";
  }
  if (status === "DRAFT") {
    return "DRAFT";
  }
  if (status === "CANCELED") {
    return "CANCELED";
  }
  return "PENDING";
}

export function StatusPill({ status, variant }: StatusPillProps) {
  const copy = t("dashboard");
  const kind = pillKind(status);
  const label =
    variant === "list"
      ? {
          PAID: copy.statusPaidCaps,
          PENDING: copy.statusPendingCaps,
          OVERDUE: copy.statusOverdueCaps,
          DRAFT: copy.statusDraftCaps,
          CANCELED: copy.statusCanceledCaps,
        }[kind]
      : {
          PAID: copy.statusPaid,
          PENDING: copy.statusPending,
          OVERDUE: copy.statusOverdue,
          DRAFT: copy.statusDraft,
          CANCELED: copy.statusCanceled,
        }[kind];

  const className = {
    PAID: "bg-[#E8F5EF] text-[#006C49]",
    PENDING: "bg-[#FFF4E5] text-[#C2410C]",
    OVERDUE: "bg-[#FEECEC] text-[#DC2626]",
    DRAFT: "bg-[#F3F4F6] text-[#4B5563]",
    CANCELED: "bg-[#F3F4F6] text-[#9CA3AF]",
  }[kind];

  const size =
    variant === "list"
      ? "px-2.5 py-0.5 text-[11px] font-semibold leading-5"
      : variant === "drawer"
        ? "px-2 py-0.5 text-[11px] font-semibold leading-[15px]"
        : "px-[9px] py-[3px] text-[12px] font-semibold leading-4";

  return (
    <span className={`inline-flex items-center justify-center rounded-full ${size} ${className}`}>
      {label}
    </span>
  );
}
