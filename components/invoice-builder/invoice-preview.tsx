import { InvoiceBankTransfer } from "@/components/invoice/invoice-bank-transfer";
import { InvoicePlatformDisclaimer } from "@/components/invoice/invoice-platform-disclaimer";
import { formatInvoiceDate } from "@/lib/invoices/dates";
import { formatMajorMoney, formatMoney } from "@/lib/invoices/money";
import { hasBankTransfer } from "@/lib/invoices/bank-transfer";
import { invoiceTemplateSkin } from "@/lib/invoices/template-layout";
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
const tableGrid =
  "grid grid-cols-[minmax(0,1.6fr)_minmax(2rem,0.45fr)_minmax(4.75rem,0.75fr)_minmax(3rem,0.5fr)_minmax(4.75rem,0.75fr)]";

export function InvoicePreview({ state, currency, totals, zoom }: InvoicePreviewProps) {
  const accent = state.accentColor === "#000000" ? "var(--invoice-accent)" : state.accentColor;
  const skin = invoiceTemplateSkin(state.template);
  const taxLabel = state.taxRate.trim() === "" ? "0" : state.taxRate;
  const money = (minor: bigint) => formatMoney(minor, currency.symbol, currency.exponent);
  const unit = (value: string) => formatMajorMoney(value, currency.symbol, currency.exponent);
  const showPayment = hasBankTransfer(state) || Boolean(state.paymentDetails.trim());
  const showNotes = Boolean(state.notes.trim());
  const markColor = skin.markUsesAccent ? accent : "var(--invoice-accent)";

  return (
    <article
      className="invoice-paper w-full max-w-[700px] origin-top overflow-hidden bg-white p-8 sm:p-12"
      style={{ transform: `scale(${zoom})` }}
    >
      {skin.accentStripe ? <div className="-mx-8 mb-8 h-1 sm:-mx-12" style={{ background: accent }} /> : null}

      <header className="flex min-w-0 items-start justify-between gap-6">
        <div className={`min-w-0 flex-1 ${wrap}`}>
          <p className={`text-[28px] font-semibold leading-8 tracking-[-0.6px] ${wrap}`} style={{ color: markColor }}>
            {state.businessName || "Your business"}
          </p>
          {state.businessAddress ? (
            <p className={`mt-2 whitespace-pre-wrap text-[13px] leading-5 text-puyer-muted ${wrap}`}>
              {state.businessAddress}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[28px] font-bold leading-8 tracking-[-0.4px] text-puyer-ink uppercase">Invoice</p>
          <p className="mt-1 font-mono text-[13px] font-medium leading-5 whitespace-nowrap text-puyer-muted">
            #{state.invoiceNumber}
          </p>
        </div>
      </header>

      <div className="mt-10 flex min-w-0 gap-8">
        <div className={`min-w-0 flex-1 ${wrap}`}>
          <p className="text-[11px] font-semibold tracking-[0.8px] text-puyer-muted uppercase">Billed to</p>
          <p className={`pt-1 text-[16px] font-semibold leading-6 text-puyer-ink ${wrap}`}>
            {state.clientName || "Client"}
          </p>
          <p className={`whitespace-pre-wrap text-[13px] leading-5 text-puyer-muted ${wrap}`}>{state.clientAddress}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.8px] text-puyer-muted uppercase">Invoice details</p>
          <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1 text-[13px] leading-5">
            <dt className="text-puyer-muted">Date issued</dt>
            <dd className="min-w-0 text-right font-medium text-puyer-ink">{formatInvoiceDate(state.issueDate)}</dd>
            <dt className="text-puyer-muted">Due date</dt>
            <dd className="min-w-0 text-right font-medium text-puyer-ink">{formatInvoiceDate(state.dueDate)}</dd>
          </dl>
        </div>
      </div>

      <div className="mt-8 min-w-0 overflow-x-auto">
        <div
          className={`${tableGrid} min-w-[520px] px-3 py-2.5 text-[10px] font-semibold tracking-[0.7px] uppercase ${
            skin.filledTableHead
              ? skin.tableHeadUsesAccent
                ? "text-white"
                : "bg-puyer-soft text-puyer-muted"
              : "border-b border-puyer-border text-puyer-muted"
          }`}
          style={skin.tableHeadUsesAccent ? { background: accent } : undefined}
        >
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Tax (%)</span>
          <span className="text-right">Total</span>
        </div>
        {state.items.map((item, index) => (
          <div
            key={item.id}
            className={`${tableGrid} min-w-[520px] px-3 py-2.5 text-[13px] leading-5 ${
              skin.zebra
                ? index % 2 === 1
                  ? "bg-puyer-soft"
                  : ""
                : "border-b border-puyer-border"
            }`}
          >
            <span className={wrap}>{item.description || "—"}</span>
            <span className="text-right font-mono">{item.quantity || "0"}</span>
            <span className="text-right font-mono">{unit(item.unitPrice)}</span>
            <span className="text-right font-mono">{taxLabel}</span>
            <span className="text-right font-mono">{money(totals.lineAmounts[index] ?? 0n)}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 ml-auto w-full max-w-[280px] text-[13px] leading-5">
        <div className="flex justify-between border-b border-dotted border-puyer-border py-2">
          <span className="text-puyer-muted">Subtotal</span>
          <span className="font-mono font-medium">{money(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between border-b border-dotted border-puyer-border py-2">
          <span className="text-puyer-muted">Tax ({taxLabel}%)</span>
          <span className="font-mono font-medium">{money(totals.taxAmount)}</span>
        </div>
        {totals.discountAmount > 0n ? (
          <div className="flex justify-between border-b border-dotted border-puyer-border py-2">
            <span className="text-puyer-muted">Discount</span>
            <span className="font-mono font-medium">−{money(totals.discountAmount)}</span>
          </div>
        ) : null}
        <div
          className={`mt-2 flex justify-between px-3 py-2.5 text-[15px] font-semibold ${
            skin.filledTotalDue ? "text-white" : "text-puyer-ink"
          }`}
          style={skin.filledTotalDue ? { background: accent } : { color: markColor }}
        >
          <span>Total due</span>
          <span className="font-mono">{money(totals.total)}</span>
        </div>
      </div>

      {showPayment ? (
        <div className="mt-10 min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.8px] text-puyer-ink uppercase">Payment instructions</p>
          {hasBankTransfer(state) ? (
            <div className="mt-2 rounded border border-puyer-border bg-puyer-soft p-3">
              <InvoiceBankTransfer state={state} className="mt-0" />
            </div>
          ) : null}
          {state.paymentDetails.trim() ? (
            <p className={`mt-2 whitespace-pre-wrap text-[12px] leading-5 text-puyer-muted ${wrap}`}>
              {state.paymentDetails}
            </p>
          ) : null}
          {hasBankTransfer(state) ? (
            <p className="mt-2 text-[11px] leading-4 text-puyer-muted italic">
              Please include invoice number #{state.invoiceNumber} in remittance.
            </p>
          ) : null}
        </div>
      ) : null}

      {showNotes ? (
        <p className={`mt-8 whitespace-pre-wrap text-[12px] leading-5 text-puyer-muted ${wrap}`}>{state.notes}</p>
      ) : null}

      <InvoicePlatformDisclaimer className="mt-8" />
    </article>
  );
}
