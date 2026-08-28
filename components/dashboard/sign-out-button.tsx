"use client";

import { LOGIN_PATH } from "@/lib/auth/login-path";
import { t } from "@/lib/i18n";

export function SignOutButton({ className }: { className?: string }) {
  const copy = t("dashboard");

  return (
    <button
      type="button"
      className={
        className ?? "w-fit text-[12px] font-semibold tracking-[0.6px] text-[#45464d]"
      }
      onClick={() => {
        void (async () => {
          try {
            await fetch("/api/auth/signout", { method: "POST" });
          } catch {
            // Still leave the app shell even if the network call fails.
          }
          window.location.assign(LOGIN_PATH);
        })();
      }}
    >
      {copy.signOut}
    </button>
  );
}
