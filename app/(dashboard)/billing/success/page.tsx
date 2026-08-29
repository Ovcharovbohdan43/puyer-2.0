import Link from "next/link";

import { dash } from "@/lib/dashboard/chrome";
import { t } from "@/lib/i18n";

export default function BillingSuccessPage() {
  const copy = t("billing");
  return (
    <main className={`${dash.page} mx-auto flex max-w-lg flex-col gap-4 px-6 py-16`}>
      <h1 className="text-[24px] leading-8 font-semibold text-[#111827]">{copy.successTitle}</h1>
      <p className="text-[14px] leading-5 text-[#6B7280]">{copy.successBody}</p>
      <Link href="/billing" className={dash.link}>
        {copy.backToBilling}
      </Link>
    </main>
  );
}
