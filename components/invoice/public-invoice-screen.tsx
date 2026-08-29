import Link from "next/link";

import { InvoiceBankTransfer } from "@/components/invoice/invoice-bank-transfer";
import { InvoicePlatformDisclaimer } from "@/components/invoice/invoice-platform-disclaimer";
import { PublicPayPanel } from "@/components/invoice/public-pay-panel";
import type { BuilderState } from "@/components/invoice-builder/types";
import type { InvoiceTotals } from "@/lib/invoices/calculate";
import type { Currency } from "@/lib/invoices/currencies";
import { hasBankTransfer } from "@/lib/invoices/bank-transfer";
import { formatInvoiceDate } from "@/lib/invoices/dates";
import { formatMoney, parseMajorToMinor } from "@/lib/invoices/money";
import type { PublicPayBadge } from "@/lib/invoices/status";
import { t } from "@/lib/i18n";

type PublicInvoiceScreenProps = {
  publicId: string;
  state: BuilderState;
  currency: Currency;
  totals: InvoiceTotals;
  badge: PublicPayBadge;
  payable: boolean;
  connected: boolean;
  paid: boolean;
  checkout?: string | null;
};

const BADGE_CLASS: Record<PublicPayBadge, string> = {
  PENDING: "bg-[#FCDEB5] text-[#F59E0B]",
  OVERDUE: "bg-[#FCDEB5] text-[#F59E0B]",
  PARTIAL: "bg-[#FCDEB5] text-[#F59E0B]",
  PAID: "bg-[#D1FAE5] text-[#006C49]",
};

export function PublicInvoiceScreen({
  publicId,
  state,
  currency,
  totals,
  badge,
  payable,
  connected,
  paid,
  checkout,
}: PublicInvoiceScreenProps) {
  const pay = t("pay");
  const issued = formatInvoiceDate(state.issueDate);
  const due = formatInvoiceDate(state.dueDate);
  const money = (minor: bigint) => formatMoney(minor, currency.symbol, currency.exponent);
  const taxRate = state.taxRate.trim() === "" ? "0" : state.taxRate;
  const notes = [state.notes, state.paymentDetails].map((part) => part.trim()).filter(Boolean).join("\n");
  const badgeLabel =
    badge === "PAID"
      ? pay.badgePaid
      : badge === "OVERDUE"
        ? pay.badgeOverdue
        : badge === "PARTIAL"
          ? pay.badgePartial
          : pay.badgePending;

  return (
    <div className="payer-portal min-h-dvh bg-[#f1f5f9] text-puyer-ink dark:bg-background">
      <header className="border-b border-puyer-border bg-puyer-card px-6 py-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] sm:px-10">
        <Link href="/" className="block text-[24px] leading-8 font-bold text-puyer-ink">
          {pay.brand}
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-8 sm:px-10 sm:py-12 lg:flex-row lg:items-start">
        <article className="flex min-w-0 flex-1 flex-col gap-8 rounded-xl border border-puyer-border bg-puyer-card p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] sm:p-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-[32px] leading-10 font-semibold tracking-[-0.32px] text-puyer-ink">{pay.title}</h1>
              <p className="font-mono text-[14px] leading-5 font-medium tracking-normal whitespace-nowrap text-puyer-muted">
                #{state.invoiceNumber}
              </p>
              <span
                className={`mt-2 inline-flex w-fit rounded-full px-2 py-1 text-[12px] leading-4 font-semibold tracking-[0.6px] uppercase ${BADGE_CLASS[badge]}`}
              >
                {badgeLabel}
              </span>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <p className="text-[14px] leading-5 text-puyer-muted">{pay.issuedOn}</p>
              <p className="font-mono text-[14px] leading-5 font-medium text-puyer-ink">{issued}</p>
              <div className="h-2" />
              <p className="text-[14px] leading-5 text-puyer-muted">{pay.dueDate}</p>
              <p className="font-mono text-[14px] leading-5 font-bold text-puyer-ink">{due}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6 border-y border-puyer-border py-6 sm:flex-row sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-puyer-muted uppercase">{pay.from}</p>
              <p className="mt-1 min-w-0 wrap-anywhere text-[16px] leading-6 font-medium text-puyer-ink">
                {state.businessName}
              </p>
              {state.businessAddress ? (
                <p className="mt-1 min-w-0 whitespace-pre-wrap wrap-anywhere text-[14px] leading-5 text-puyer-muted">
                  {state.businessAddress}
                </p>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-puyer-muted uppercase">
                {pay.billedTo}
              </p>
              <p className="mt-1 min-w-0 wrap-anywhere text-[16px] leading-6 font-medium text-puyer-ink">
                {state.clientName}
              </p>
              {state.clientAddress ? (
                <p className="mt-1 min-w-0 whitespace-pre-wrap wrap-anywhere text-[14px] leading-5 text-puyer-muted">
                  {state.clientAddress}
                </p>
              ) : null}
            </div>
          </div>

          <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-left">
              <thead>
                <tr className="border-b border-puyer-border">
                  <th className="py-2 pr-2 text-[12px] leading-4 font-medium tracking-[0.6px] text-puyer-muted uppercase">
                    {pay.description}
                  </th>
                  <th className="w-24 py-2 text-right text-[12px] leading-4 font-medium tracking-[0.6px] text-puyer-muted uppercase">
                    {pay.qty}
                  </th>
                  <th className="w-32 py-2 text-right text-[12px] leading-4 font-medium tracking-[0.6px] text-puyer-muted uppercase">
                    {pay.rate}
                  </th>
                  <th className="w-32 py-2 text-right text-[12px] leading-4 font-medium tracking-[0.6px] text-puyer-muted uppercase">
                    {pay.amount}
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-puyer-border">
                    <td className="min-w-0 py-[18px] pr-2 wrap-anywhere text-[14px] leading-5 text-puyer-ink">
                      {item.description || "—"}
                    </td>
                    <td className="py-[18px] text-right font-mono text-[14px] leading-5 font-medium text-puyer-ink">
                      {item.quantity || "0"}
                    </td>
                    <td className="py-[18px] text-right font-mono text-[14px] leading-5 font-medium text-puyer-ink">
                      {formatUnitPrice(item.unitPrice, currency)}
                    </td>
                    <td className="py-[18px] text-right font-mono text-[14px] leading-5 font-medium text-puyer-ink">
                      {money(totals.lineAmounts[index] ?? 0n)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex w-full max-w-[256px] justify-between gap-4 self-end">
              <span className="text-[14px] leading-5 text-puyer-muted">{pay.subtotal}</span>
              <span className="font-mono text-[14px] leading-5 font-medium text-puyer-ink">{money(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0n ? (
              <div className="flex w-full max-w-[256px] justify-between gap-4 self-end">
                <span className="text-[14px] leading-5 text-puyer-muted">{pay.discount}</span>
                <span className="font-mono text-[14px] leading-5 font-medium text-puyer-ink">
                  −{money(totals.discountAmount)}
                </span>
              </div>
            ) : null}
            <div className="flex w-full max-w-[256px] justify-between gap-4 self-end">
              <span className="text-[14px] leading-5 text-puyer-muted">{pay.tax.replace("{rate}", taxRate)}</span>
              <span className="font-mono text-[14px] leading-5 font-medium text-puyer-ink">{money(totals.taxAmount)}</span>
            </div>
            <div className="mt-2 flex w-full max-w-[256px] justify-between gap-4 self-end border-t border-puyer-border pt-2">
              <span className="text-[16px] leading-6 font-semibold text-puyer-ink">{pay.totalDue}</span>
              <span className="font-mono text-[14px] leading-5 font-semibold text-puyer-ink">{money(totals.total)}</span>
            </div>
          </div>

          <div className="border-t border-puyer-border pt-8">
            <p className="text-[12px] leading-4 font-semibold tracking-[0.6px] text-puyer-muted uppercase">
              {pay.notesTerms}
            </p>
            <InvoiceBankTransfer state={state} className="mt-2" />
            {notes ? (
              <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-[14px] leading-5 text-puyer-muted">{notes}</p>
            ) : null}
            <InvoicePlatformDisclaimer />
          </div>
        </article>

        <PublicPayPanel
          publicId={publicId}
          amountLabel={money(totals.total)}
          dueLabel={paid ? null : pay.dueOn.replace("{date}", due)}
          pdfHref={`/api/public/invoices/${encodeURIComponent(publicId)}/pdf`}
          payable={payable}
          connected={connected}
          paid={paid}
          hasBankTransfer={hasBankTransfer(state)}
          checkout={checkout}
        />
      </div>
    </div>
  );
}

function formatUnitPrice(unitPrice: string, currency: Currency): string {
  try {
    return formatMoney(parseMajorToMinor(unitPrice || "0", currency.exponent), currency.symbol, currency.exponent);
  } catch {
    return unitPrice || formatMoney(0n, currency.symbol, currency.exponent);
  }
}
