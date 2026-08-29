import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PuyerLogo } from "@/components/brand/puyer-logo";
import { hasMagicLinkParams } from "@/lib/auth/complete-magic-link";
import { loginUrl } from "@/lib/auth/login-path";
import { sanitizeReturnTo } from "@/lib/auth/return-to";
import { t } from "@/lib/i18n";

export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const text = Array.isArray(value) ? value[0] : value;
    if (text) {
      params.set(key, text);
    }
  }
  if (!hasMagicLinkParams(params)) {
    redirect(loginUrl({ error: true }));
  }

  const cookieStore = await cookies();
  if (!params.get("next")) {
    const next = sanitizeReturnTo(cookieStore.get("puyer-auth-return")?.value);
    if (next) {
      params.set("next", next);
    }
  }

  const copy = t("auth");
  const fields = ["code", "token_hash", "token", "type", "next"] as const;

  return (
    <main className="flex min-h-dvh flex-col bg-white px-6 py-6">
      <div className="flex items-center">
        <Link href="/" className="inline-flex items-center">
          <PuyerLogo height={36} />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[400px]">
          <h1 className="text-[28px] leading-9 font-semibold text-[#111827]">{copy.confirmTitle}</h1>
          <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">{copy.confirmBody}</p>
          <form action="/auth/confirm/complete" method="post" className="mt-6">
            {fields.map((name) => {
              const value = params.get(name);
              if (!value) {
                return null;
              }
              return <input key={name} type="hidden" name={name} value={value} />;
            })}
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#006C49] text-[15px] font-semibold text-white"
            >
              {copy.confirmContinue}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
