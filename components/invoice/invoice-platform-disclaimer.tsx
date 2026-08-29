import { INVOICE_PLATFORM_DISCLAIMER } from "@/lib/invoices/disclaimer";

type InvoicePlatformDisclaimerProps = {
  className?: string;
};

export function InvoicePlatformDisclaimer({ className = "mt-4" }: InvoicePlatformDisclaimerProps) {
  return (
    <p
      className={`invoice-platform-disclaimer whitespace-pre-wrap wrap-anywhere text-[10px] leading-4 text-puyer-muted ${className}`}
    >
      {INVOICE_PLATFORM_DISCLAIMER}
    </p>
  );
}
