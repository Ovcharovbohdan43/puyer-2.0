"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PuyerSpinner } from "@/components/brand/puyer-spinner";
import { t } from "@/lib/i18n";

type Item = {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationsScreenProps = {
  items: Item[];
  emailEnabled: boolean;
  inAppEnabled: boolean;
  remindersEnabled: boolean;
};

export function NotificationsScreen({
  items,
  emailEnabled,
  inAppEnabled,
  remindersEnabled,
}: NotificationsScreenProps) {
  const copy = t("notifications");
  const dash = t("dashboard");
  const router = useRouter();
  const [email, setEmail] = useState(emailEnabled);
  const [inApp, setInApp] = useState(inAppEnabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function savePrefs(next: { emailEnabled?: boolean; inAppEnabled?: boolean }) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(body.error || copy.saveFailed);
        return;
      }
      router.refresh();
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }

  async function markRead(id?: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(body.error || copy.saveFailed);
        return;
      }
      router.refresh();
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 bg-[#F6F7F6] px-6 py-16">
      <p className="text-[12px] font-semibold text-[#006C49]">{dash.nav.notifications}</p>
      <h1 className="flex items-center gap-3 text-[24px] leading-8 font-semibold text-[#111827]">
        {copy.title}
        {pending ? <PuyerSpinner size={22} /> : null}
      </h1>
      <p className="text-[14px] leading-5 text-[#6B7280]">
        {remindersEnabled ? copy.remindersOn : copy.remindersOff}
      </p>
      <div className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <label className="flex items-center justify-between gap-4 text-[14px] text-[#111827]">
          <span>{copy.emailLabel}</span>
          <button
            type="button"
            role="switch"
            aria-checked={email}
            disabled={pending}
            className="dash-toggle"
            data-on={email ? "true" : "false"}
            onClick={() => {
              const value = !email;
              setEmail(value);
              void savePrefs({ emailEnabled: value });
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-4 text-[14px] text-[#111827]">
          <span>{copy.inAppLabel}</span>
          <button
            type="button"
            role="switch"
            aria-checked={inApp}
            disabled={pending}
            className="dash-toggle"
            data-on={inApp ? "true" : "false"}
            onClick={() => {
              const value = !inApp;
              setInApp(value);
              void savePrefs({ inAppEnabled: value });
            }}
          />
        </label>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#111827]">{copy.inbox}</h2>
        {items.some((item) => !item.readAt) ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void markRead()}
            className="text-[12px] font-semibold text-[#006C49] disabled:opacity-60"
          >
            {copy.markAll}
          </button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">{copy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border border-[#E5E7EB] p-4 ${item.readAt ? "bg-[#F9FAFB]" : "bg-white"}`}
            >
              <p className="text-[14px] font-semibold text-[#111827]">{item.title}</p>
              <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">{item.message}</p>
              {!item.readAt ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void markRead(item.id)}
                  className="mt-3 text-[12px] font-semibold text-[#006C49] disabled:opacity-60"
                >
                  {copy.markRead}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="text-[12px] text-[#DC2626]">{error}</p> : null}
    </main>
  );
}
