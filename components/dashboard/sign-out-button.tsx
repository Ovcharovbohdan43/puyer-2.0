"use client";

import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/auth/browser";
import { t } from "@/lib/i18n";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const copy = t("dashboard");

  return (
    <button
      type="button"
      className={
        className ?? "w-fit text-[12px] font-semibold tracking-[0.6px] text-[#45464d]"
      }
      onClick={() => {
        void (async () => {
          const supabase = createBrowserSupabaseClient();
          await supabase?.auth.signOut();
          router.push("/");
          router.refresh();
        })();
      }}
    >
      {copy.signOut}
    </button>
  );
}
