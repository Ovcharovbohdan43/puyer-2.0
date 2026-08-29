import { InvoiceBankTransfer } from "@/components/invoice/invoice-bank-transfer";
import { InvoicePlatformDisclaimer } from "@/components/invoice/invoice-platform-disclaimer";
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
const NAVY = "#0B1C30";
const MINT = "#6CF8BB";

export function InvoicePreview({ state, currency, totals, zoom }: InvoicePreviewProps) {
  const accent = state.accentColor === "#000000" ? "var(--invoice-accent)" : state.accentColor;
  const isMinimal = state.template === "MINIMAL";
  const isPremium = state.template === "PREMIUM";
  const taxLabel = state.taxRate.trim() === "" ? "0" : state.taxRate;
  const money = (minor: bigint) => formatMoney(minor, currency.symbol, currency.exponent);

  return (
    <article
      className={`invoice-paper w-full max-w-[700px] origin-top overflow-hidden bg-white ${
        isPremium ? "p-0" : "p-8 sm:p-12"
      }`}
      style={{ transform: `scale(${zoom})` }}
    >
      {isPremium ? (
        <PremiumHeader state={state} accent={accent} />
      ) : (
        <ClassicHeader state={state} accent={accent} isMinimal={isMinimal} />
      )}

      <div className={isPremium ? "px-8 pb-8 pt-6 sm:px-12 sm:pb-12" : ""}>
        <div className={`flex min-w-0 gap-8 ${isPremium ? "rounded-lg bg-puyer-soft p-4" : "mt-8"}`}>
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

        <div className={`min-w-0 ${isPremium ? "mt-6" : "mt-8"}`}>
          <div
            className={`grid grid-cols-[minmax(0,1fr)_72px_110px] pb-2 text-[12px] font-semibold tracking-[0.6px] ${
              isPremium
                ? accent === "var(--invoice-accent)"
                  ? "rounded-t px-3 py-2.5 text-puyer-ink"
                  : "rounded-t px-3 py-2.5 text-white"
                : isMinimal
                  ? "border-b border-[#e2e8f0] text-[#45464d]"
                  : "border-b-2 text-[#45464d]"
            }`}
            style={
              isPremium
                ? { background: accent }
                : isMinimal
                  ? undefined
                  : { borderBottomColor: accent }
            }
          >
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Amount</span>
          </div>
          {state.items.map((item, index) => (
            <div
              key={item.id}
              className={`grid grid-cols-[minmax(0,1fr)_72px_110px] py-2 text-[14px] ${
                isPremium ? "border-x border-[#e2e8f0] px-3 even:bg-puyer-soft" : "border-b border-[#e2e8f0]"
              }`}
            >
              <span className={wrap}>{item.description || "—"}</span>
              <span className="text-right font-mono">{item.quantity || "0"}</span>
              <span className="text-right font-mono">{money(totals.lineAmounts[index] ?? 0n)}</span>
            </div>
          ))}
          {isPremium ? <div className="h-px bg-[#e2e8f0]" /> : null}

          <div className={`ml-auto mt-4 w-full max-w-[265px] text-[14px] ${isPremium ? "rounded-lg p-4 text-white" : ""}`} style={isPremium ? { background: NAVY } : undefined}>
            <div className={`flex justify-between py-1 ${isPremium ? "" : "border-b border-[#e2e8f0]"}`}>
              <span className={isPremium ? "text-[#94A3B8]" : "text-[#45464d]"}>Subtotal</span>
              <span className="font-mono">{money(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0n ? (
              <div className={`flex justify-between py-1 ${isPremium ? "" : "border-b border-[#e2e8f0]"}`}>
                <span className={isPremium ? "text-[#94A3B8]" : "text-[#45464d]"}>Discount</span>
                <span className="font-mono">−{money(totals.discountAmount)}</span>
              </div>
            ) : null}
            <div className={`flex justify-between py-1 ${isPremium ? "" : "border-b border-[#e2e8f0]"}`}>
              <span className={isPremium ? "text-[#94A3B8]" : "text-[#45464d]"}>Tax ({taxLabel}%)</span>
              <span className="font-mono">{money(totals.taxAmount)}</span>
            </div>
            <div
              className={`flex justify-between pb-1 pt-3 text-[24px] font-semibold leading-8`}
              style={{ color: isPremium ? MINT : isMinimal ? "var(--invoice-accent)" : accent }}
            >
              <span>Total</span>
              <span>{money(totals.total)}</span>
            </div>
          </div>
        </div>

        <InvoiceBankTransfer state={state} />
        {state.paymentDetails ? (
          <p className={`mt-6 whitespace-pre-wrap text-[14px] leading-5 text-[#45464d] ${wrap}`}>{state.paymentDetails}</p>
        ) : null}

        {state.notes ? (
          <p
            className={`mt-8 pt-[25px] text-center text-[12px] font-semibold tracking-[0.6px] text-[#45464d] ${wrap} ${
              isMinimal ? "border-t-0" : "border-t border-[#e2e8f0]"
            }`}
          >
            {state.notes}
          </p>
        ) : null}
        <InvoicePlatformDisclaimer
          className={state.notes ? "mt-4" : isMinimal ? "mt-8" : "mt-8 border-t border-[#e2e8f0] pt-[25px]"}
        />
      </div>
    </article>
  );
}

function ClassicHeader({
  state,
  accent,
  isMinimal,
}: {
  state: BuilderState;
  accent: string;
  isMinimal: boolean;
}) {
  return (
    <div
      className="flex items-start justify-between gap-6 pb-[26px]"
      style={{ borderBottom: isMinimal ? "1px solid var(--puyer-border)" : `2px solid ${accent}` }}
    >
      <div className="min-w-0 shrink-0">
        <p
          className={`font-semibold uppercase leading-10 ${
            isMinimal ? "text-[22px] tracking-[4px] text-puyer-ink" : "text-[32px] tracking-[-0.8px]"
          }`}
          style={isMinimal ? undefined : { color: accent }}
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
  );
}

function PremiumHeader({ state, accent }: { state: BuilderState; accent: string }) {
  return (
    <div style={{ background: NAVY }}>
      <div className="h-[6px]" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-6 px-8 py-8 sm:px-12">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-[3px] text-[#6CF8BB] uppercase">Invoice</p>
          <p className="mt-2 text-[32px] font-semibold leading-10 tracking-[-0.6px] text-white">#{state.invoiceNumber}</p>
        </div>
        <div className={`max-w-[58%] flex-1 text-right ${wrap}`}>
          <p className={`text-[20px] font-semibold leading-7 text-white ${wrap}`}>
            {state.businessName || "Your business"}
          </p>
          {state.businessAddress ? (
            <p className={`mt-1 whitespace-pre-wrap text-[12px] leading-4 text-[#94A3B8] ${wrap}`}>
              {state.businessAddress}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
