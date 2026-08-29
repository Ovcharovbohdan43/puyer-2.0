import { formatUsdLike } from "@/lib/invoices/list-view";

export type PaymentListRow = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: string;
  status: string;
};

export function toPaymentListRow(payment: {
  id: string;
  amountMinor: bigint;
  currency: string;
  status: string;
  invoice: { invoiceNumber: string; clientName: string };
}): PaymentListRow {
  return {
    id: payment.id,
    invoiceNumber: payment.invoice.invoiceNumber,
    clientName: payment.invoice.clientName,
    amount: formatUsdLike(payment.amountMinor, payment.currency),
    status: payment.status,
  };
}
