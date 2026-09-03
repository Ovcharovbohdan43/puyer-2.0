import Image from "next/image";

import type { InvoiceTemplate } from "@/components/invoice-builder/types";

const TEMPLATE_STILL: Record<InvoiceTemplate, string> = {
  MINIMAL: "/landing/template-minimal.png",
  PROFESSIONAL: "/landing/template-professional.png",
  PREMIUM: "/landing/template-premium.png",
};

export function LandingTemplateStill({
  template,
  label,
}: {
  template: InvoiceTemplate;
  label: string;
}) {
  return (
    <div className="template-mockup relative h-80 cursor-zoom-in overflow-hidden rounded bg-[#f1f5f9]">
      <Image
        src={TEMPLATE_STILL[template]}
        alt={label}
        fill
        className="object-contain object-top transition-transform duration-300 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        sizes="(min-width: 768px) 30vw, 100vw"
      />
    </div>
  );
}
