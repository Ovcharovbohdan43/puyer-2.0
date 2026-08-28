import Link from "next/link";

import { t } from "@/lib/i18n";

export default function BillingSuccessPage() {
  const copy = t("billing");
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-6 py-16">
      <h1 className="text-[24px] leading-8 font-semibold text-[#F8F9FF]">{copy.successTitle}</h1>
      <p className="text-[14px] leading-5 text-[#BEC6E0]">{copy.successBody}</p>
      <Link href="/billing" className="text-[12px] font-semibold tracking-[0.6px] text-[#6FFBBE]">
        {copy.backToBilling}
      </Link>
    </main>
  );
}
