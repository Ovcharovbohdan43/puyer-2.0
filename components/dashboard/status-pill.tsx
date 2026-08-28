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

  const className =
    variant === "list"
      ? {
          PAID: "border-[rgba(0,108,73,0.2)] bg-[#005236] text-[#6FFBBE]",
          PENDING: "border-[rgba(198,198,205,0.3)] bg-[#565E74] text-[#F8F9FF]",
          OVERDUE: "border-[rgba(186,26,26,0.3)] bg-[rgba(186,26,26,0.2)] text-[#EF4444]",
          DRAFT: "border-[rgba(198,198,205,0.3)] bg-[#3F465C] text-[#BEC6E0]",
          CANCELED: "border-[rgba(198,198,205,0.3)] bg-[#3F465C] text-[#7C839B]",
        }[kind]
      : {
          PAID: "border-[rgba(111,251,190,0.2)] bg-[rgba(111,251,190,0.1)] text-[#6ffbbe]",
          PENDING: "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] text-[#f59e0b]",
          OVERDUE: "border-[rgba(186,26,26,0.3)] bg-[rgba(186,26,26,0.2)] text-[#EF4444]",
          DRAFT: "border-[rgba(198,198,205,0.3)] bg-[#3F465C] text-[#BEC6E0]",
          CANCELED: "border-[rgba(198,198,205,0.3)] bg-[#3F465C] text-[#7C839B]",
        }[kind];

  const size =
    variant === "list"
      ? "px-2.5 py-0.5 text-[10px] font-normal leading-5"
      : variant === "drawer"
        ? "px-2 py-0.5 text-[10px] font-normal leading-[15px]"
        : "px-[9px] py-[3px] text-[12px] font-semibold leading-4 tracking-[0.6px]";

  const drawerPaid = variant === "drawer" && kind === "PAID";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border ${size} ${drawerPaid ? "border-transparent bg-[#005236] text-[#6FFBBE]" : className}`}
    >
      {label}
    </span>
  );
}
