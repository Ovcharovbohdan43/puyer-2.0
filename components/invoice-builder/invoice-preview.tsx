import { formatInvoiceDate } from "@/lib/invoices/dates";
import { formatMoney } from "@/lib/invoices/money";
import type { Currency } from "@/lib/invoices/currencies";
import type { InvoiceTotals } from "@/lib/invoices/calculate";
import type { BuilderState } from "@/components/invoice-builder/types";

type InvoicePreviewProps = {
  state: BuilderState;
  currency: Currency;
  totals: InvoiceTotals;
  zoom: number;
};

const wrap = "min-w-0 wrap-anywhere";

export function InvoicePreview({ state, currency, totals, zoom }: InvoicePreviewProps) {
  const accent = state.accentColor === "#000000" ? "var(--invoice-accent)" : state.accentColor;
  const isMinimal = state.template === "MINIMAL";
  const isPremium = state.template === "PREMIUM";
  const taxLabel = state.taxRate.trim() === "" ? "0" : state.taxRate;

  return (
    <article
      className="invoice-paper w-full max-w-[700px] origin-top overflow-hidden bg-white p-8 sm:p-12"
      style={{
        transform: `scale(${zoom})`,
        borderTop: isPremium ? `6px solid ${accent}` : undefined,
      }}
    >
      <div
        className="flex items-start justify-between gap-6 pb-[26px]"
        style={{ borderBottom: isMinimal ? "1px solid var(--puyer-border)" : `2px solid ${accent}` }}
      >
        <div className="min-w-0 shrink-0">
          <p
            className="text-[32px] font-semibold uppercase leading-10 tracking-[-0.8px]"
            style={{ color: isMinimal ? "var(--foreground)" : accent }}
          >
            Invoice
          </p>
          <p className="font-mono text-[14px] font-medium leading-5 tracking-normal whitespace-nowrap text-[#45464d]">
            #{state.invoiceNumber}
          </p>
        </div>
        <div className={`flex max-w-[58%] flex-1 flex-col items-end gap-2 ${wrap}`}>
          {isMinimal ? null : <span className="size-12 shrink-0 rounded-full" style={{ background: accent }} />}
          <p className={`w-full text-right text-[24px] font-semibold leading-8 text-black ${wrap}`}>
            {state.businessName || "Your business"}
          </p>
          {state.businessAddress ? (
            <p className={`w-full whitespace-pre-wrap text-right text-[12px] leading-4 text-[#45464d] ${wrap}`}>
              {state.businessAddress}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex min-w-0 gap-8">
        <div className={`flex-1 ${wrap}`}>
          <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">Billed To</p>
          <p className={`pt-1 text-[16px] font-semibold leading-6 text-black ${wrap}`}>
            {state.clientName || "Client"}
          </p>
          <p className={`whitespace-pre-wrap text-[14px] leading-5 text-[#45464d] ${wrap}`}>{state.clientAddress}</p>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-1 text-[14px]">
          <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">Date</p>
          <p className="min-w-0 font-mono font-medium">{formatInvoiceDate(state.issueDate)}</p>
          <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">Due Date</p>
          <p className="min-w-0 font-mono font-medium">{formatInvoiceDate(state.dueDate)}</p>
        </div>
      </div>

      <div className="mt-8 min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_72px_110px] border-b border-[#e2e8f0] pb-2 text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Amount</span>
        </div>
        {state.items.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_72px_110px] border-b border-[#e2e8f0] py-2 text-[14px]"
          >
            <span className={wrap}>{item.description || "—"}</span>
            <span className="text-right font-mono">{item.quantity || "0"}</span>
            <span className="text-right font-mono">
              {formatMoney(totals.lineAmounts[index] ?? 0n, currency.symbol, currency.exponent)}
            </span>
          </div>
        ))}
        <div className="ml-auto mt-2 w-full max-w-[265px] text-[14px]">
          <div className="flex justify-between border-b border-[#e2e8f0] py-1">
            <span className="text-[#45464d]">Subtotal</span>
            <span className="font-mono">{formatMoney(totals.subtotal, currency.symbol, currency.exponent)}</span>
          </div>
          {totals.discountAmount > 0n ? (
            <div className="flex justify-between border-b border-[#e2e8f0] py-1">
              <span className="text-[#45464d]">Discount</span>
              <span className="font-mono">
                −{formatMoney(totals.discountAmount, currency.symbol, currency.exponent)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between border-b border-[#e2e8f0] py-1">
            <span className="text-[#45464d]">Tax ({taxLabel}%)</span>
            <span className="font-mono">{formatMoney(totals.taxAmount, currency.symbol, currency.exponent)}</span>
          </div>
          <div className="flex justify-between pb-2 pt-3 text-[24px] font-semibold leading-8" style={{ color: accent }}>
            <span>Total</span>
            <span>{formatMoney(totals.total, currency.symbol, currency.exponent)}</span>
          </div>
        </div>
      </div>

      {state.paymentDetails ? (
        <p className={`mt-6 whitespace-pre-wrap text-[14px] leading-5 text-[#45464d] ${wrap}`}>{state.paymentDetails}</p>
      ) : null}

      <p className={`mt-8 border-t border-[#e2e8f0] pt-[25px] text-center text-[12px] font-semibold tracking-[0.6px] text-[#45464d] ${wrap}`}>
        {state.notes}
      </p>
    </article>
  );
}
