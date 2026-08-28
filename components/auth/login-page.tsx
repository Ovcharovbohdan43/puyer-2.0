"use client";

import Image from "next/image";
import Link from "next/link";

import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { AuthIntent } from "@/lib/auth/return-to";
import { t } from "@/lib/i18n";

type LoginPageViewProps = {
  intent: AuthIntent;
  expired: boolean;
};

export function LoginPageView({ intent, expired }: LoginPageViewProps) {
  const copy = t("auth");
  const header = t("header");

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-2">
      <section className="flex min-h-dvh flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-[24px] font-semibold leading-8 text-puyer-ink">
            {header.brand}
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            {expired ? (
              <p className="mb-4 rounded border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[13px] leading-5 text-[#991b1b]">
                {copy.linkExpired}
              </p>
            ) : null}
            <MagicLinkForm intent={intent} showModeToggle />
          </div>
        </div>
      </section>

      <aside className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-[#F4FBF7] px-8 py-12 lg:min-h-dvh">
        <Image
          src="/auth/login-hero.png"
          alt={copy.heroAlt}
          width={1024}
          height={1024}
          priority
          className="mx-auto size-full max-h-[520px] max-w-[520px] object-contain"
        />
        <p className="pointer-events-none absolute bottom-8 left-8 right-8 text-center text-[14px] leading-5 text-[#475569]">
          {copy.heroCaption}
        </p>
      </aside>
    </main>
  );
}
