import type { BuilderState, InvoiceTemplate } from "@/components/invoice-builder/types";
import { createDefaultBuilderState } from "@/components/invoice-builder/types";

const ACCENT: Record<InvoiceTemplate, string> = {
  MINIMAL: "#000000",
  PROFESSIONAL: "#006c49",
  PREMIUM: "#006c49",
};

/** Sample invoice used on the landing template cards — same layout as the live builder. */
export function landingTemplateDemoState(template: InvoiceTemplate): BuilderState {
  return {
    ...createDefaultBuilderState(),
    template,
    accentColor: ACCENT[template],
  };
}
