"use client";

import type { AuthIntent } from "@/components/invoice-builder/builder-session";
import { useBuilderSession } from "@/components/invoice-builder/builder-session";
import type { InvoiceTemplate } from "@/components/invoice-builder/types";

type ButtonProps = {
  className?: string;
  children: React.ReactNode;
};

export function CreateInvoiceButton({ className, children }: ButtonProps) {
  const { startInvoice } = useBuilderSession();
  return (
    <button type="button" className={className} onClick={startInvoice}>
      {children}
    </button>
  );
}

export function UseTemplateButton({
  template,
  className,
  children,
}: ButtonProps & { template: InvoiceTemplate }) {
  const { applyTemplate } = useBuilderSession();
  return (
    <button type="button" className={className} onClick={() => applyTemplate(template)}>
      {children}
    </button>
  );
}

export function OpenAuthButton({
  intent,
  className,
  children,
}: ButtonProps & { intent: AuthIntent }) {
  const { openAuth, requestNavigate } = useBuilderSession();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (intent === "login" || intent === "subscribe") {
          requestNavigate(intent === "subscribe" ? "/login?intent=subscribe" : "/login");
          return;
        }
        openAuth(intent);
      }}
    >
      {children}
    </button>
  );
}
