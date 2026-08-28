import { createHash } from "node:crypto";

import type { BuilderState } from "@/components/invoice-builder/types";
import type { PaperSize } from "@/lib/pdf/paper";

export function invoicePdfHash(state: BuilderState, paper: PaperSize, branded: boolean): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        layout: 3,
        paper,
        branded,
        invoiceNumber: state.invoiceNumber,
        currency: state.currency,
        businessName: state.businessName,
        businessAddress: state.businessAddress,
        clientName: state.clientName,
        clientAddress: state.clientAddress,
        items: state.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discountType: state.discountType,
        discountValue: state.discountValue,
        taxRate: state.taxRate,
        notes: state.notes,
        paymentDetails: state.paymentDetails,
        template: state.template,
        accentColor: state.accentColor,
        issueDate: state.issueDate,
        dueDate: state.dueDate,
      }),
    )
    .digest("hex")
    .slice(0, 32);
}
