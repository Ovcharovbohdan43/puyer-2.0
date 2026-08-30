"use client";

import dynamic from "next/dynamic";

import { LandingBuilderPlaceholder } from "@/components/marketing/landing-builder-placeholder";

const InvoiceBuilder = dynamic(
  () => import("@/components/invoice-builder/invoice-builder").then((mod) => ({ default: mod.InvoiceBuilder })),
  { ssr: false, loading: () => <LandingBuilderPlaceholder /> },
);

export function LandingInvoiceBuilder() {
  return <InvoiceBuilder paged />;
}
