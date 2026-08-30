"use client";

import dynamic from "next/dynamic";

import type { InvoiceTemplate } from "@/components/invoice-builder/types";

const TemplateInvoiceMockup = dynamic(
  () => import("@/components/marketing/template-invoice-mockup").then((mod) => ({ default: mod.TemplateInvoiceMockup })),
  { ssr: false, loading: () => <div className="template-mockup h-80 rounded bg-[#f1f5f9]" aria-hidden /> },
);

export function LandingTemplateMockup({ template, label }: { template: InvoiceTemplate; label: string }) {
  return <TemplateInvoiceMockup template={template} label={label} />;
}
