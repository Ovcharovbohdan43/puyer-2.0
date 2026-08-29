import { InvoicePreview } from "@/components/invoice-builder/invoice-preview";
import type { InvoiceTemplate } from "@/components/invoice-builder/types";
import { calculateInvoiceTotals } from "@/lib/invoices/calculate";
import { getCurrency } from "@/lib/invoices/currencies";
import { landingTemplateDemoState } from "@/lib/invoices/template-demo";

type TemplateInvoiceMockupProps = {
  template: InvoiceTemplate;
  label: string;
};

export function TemplateInvoiceMockup({ template, label }: TemplateInvoiceMockupProps) {
  const state = landingTemplateDemoState(template);
  const currency = getCurrency(state.currency);
  const totals = calculateInvoiceTotals(
    state.items,
    currency.exponent,
    state.discountType,
    state.discountValue,
    state.taxRate,
  );

  return (
    <div className="template-mockup h-80 cursor-zoom-in overflow-hidden rounded bg-[#f1f5f9] p-3">
      <div className="relative h-full w-full [container-type:inline-size]">
        <div className="origin-top-left transition-transform duration-300 ease-out group-hover:scale-[1.14] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <div
            className="pointer-events-none origin-top-left"
            style={{ width: 700, transform: "scale(calc(100cqw / 700))" }}
          >
            <InvoicePreview state={state} currency={currency} totals={totals} zoom={1} />
          </div>
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
