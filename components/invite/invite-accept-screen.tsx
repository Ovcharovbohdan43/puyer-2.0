"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PuyerBusyText } from "@/components/brand/puyer-spinner";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { PuyerLogo } from "@/components/brand/puyer-logo";
import { t } from "@/lib/i18n";

type InviteAcceptScreenProps = {
  token: string;
  orgName: string | null;
  inviteEmail: string | null;
  sessionEmail: string | null;
};

export function InviteAcceptScreen({ token, orgName, inviteEmail, sessionEmail }: InviteAcceptScreenProps) {
  const copy = t("team");
  const router = useRouter();
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const returnTo = `/invite/${token}`;
  const emailsMatch =
    sessionEmail && inviteEmail
      ? sessionEmail.trim().toLowerCase() === inviteEmail.trim().toLowerCase()
      : false;

  async function sendLink() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, returnTo }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(body.error || copy.saveFailed);
        return;
      }
      setSent(true);
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }

  async function accept() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(body.error || copy.saveFailed);
        return;
      }
      router.push("/team");
      router.refresh();
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 bg-[#F6F7F6] px-6 py-16">
      <PuyerLogo height={32} />
      <h1 className="text-[24px] leading-8 font-semibold text-[#111827]">{copy.inviteTitle}</h1>
      {!orgName ? (
        <p className="text-[14px] leading-5 text-[#6B7280]">{copy.inviteInvalid}</p>
      ) : (
        <>
          <p className="text-[14px] leading-5 text-[#6B7280]">
            {copy.inviteBody.replace("{org}", orgName)}
          </p>
          {!sessionEmail ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void sendLink();
              }}
            >
              <label className="text-[12px] text-[#6B7280]">
                {copy.inviteLabel}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 h-[38px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827]"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[#006C49] px-4 py-2 text-[14px] font-semibold text-white"
              >
                <PuyerBusyText busy={pending} busyLabel={t("header").loading} idle={copy.sendLink} />
              </button>
              {sent ? <p className="text-[14px] text-[#006C49]">{copy.linkSent}</p> : null}
            </form>
          ) : emailsMatch ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void accept()}
              className="rounded-lg bg-[#006C49] px-4 py-2 text-[14px] font-semibold text-white"
            >
              <PuyerBusyText busy={pending} busyLabel={t("header").loading} idle={copy.accept} />
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] leading-5 text-[#6B7280]">
                {copy.wrongEmail.replace("{email}", sessionEmail).replace("{invited}", inviteEmail ?? "")}
              </p>
              <SignOutButton className="text-[13px] font-medium text-[#6B7280]" />
            </div>
          )}
        </>
      )}
      {error ? <p className="text-[14px] text-[#ef4444]">{error}</p> : null}
      <Link href="/" className="text-[14px] font-semibold text-[#006C49]">
        {copy.backHome}
      </Link>
    </main>
  );
}
