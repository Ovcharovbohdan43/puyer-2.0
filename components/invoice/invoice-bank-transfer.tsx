import { BANK_TRANSFER_HEADING, bankTransferRows, hasBankTransfer } from "@/lib/invoices/bank-transfer";
import type { BankTransferDetails } from "@/lib/invoices/bank-transfer";

export function InvoiceBankTransfer({
  state,
  className = "mt-6",
}: {
  state: BankTransferDetails;
  className?: string;
}) {
  if (!hasBankTransfer(state)) {
    return null;
  }
  return (
    <div className={className}>
      <p className="text-[12px] font-semibold tracking-[0.6px] text-puyer-muted">{BANK_TRANSFER_HEADING}</p>
      <dl className="mt-2 flex flex-col gap-1">
        {bankTransferRows(state).map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-2 text-[14px] leading-5">
            <dt className="text-puyer-muted">{row.label}</dt>
            <dd className="min-w-0 font-mono wrap-anywhere text-puyer-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
