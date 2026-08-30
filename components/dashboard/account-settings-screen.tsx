"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PuyerBusyText } from "@/components/brand/puyer-spinner";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { StripeSettings } from "@/components/dashboard/stripe-settings";
import { dash as ui } from "@/lib/dashboard/chrome";
import { timezoneChoices } from "@/lib/onboarding/options";
import { t } from "@/lib/i18n";

type AccountSettingsScreenProps = {
  email: string;
  name: string;
  timezone: string;
  isOwner: boolean;
  businessName: string;
  businessAddress: string;
  deletionOpen: boolean;
  deletionCreatedAt: string | null;
  stripe: {
    isOwner: boolean;
    status: string;
    chargesEnabled: boolean;
    canConnect: boolean;
  };
};

export function AccountSettingsScreen(props: AccountSettingsScreenProps) {
  const copy = t("account");
  const dash = t("dashboard");
  const router = useRouter();
  const zones = useMemo(() => timezoneChoices(props.timezone), [props.timezone]);

  const [name, setName] = useState(props.name);
  const [timezone, setTimezone] = useState(props.timezone);
  const [businessName, setBusinessName] = useState(props.businessName);
  const [businessAddress, setBusinessAddress] = useState(props.businessAddress);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [nextEmail, setNextEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [reason, setReason] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletionOpen, setDeletionOpen] = useState(props.deletionOpen);

  async function saveProfile() {
    setProfileBusy(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, businessName, businessAddress }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setProfileError(body.error || copy.saveFailed);
        return;
      }
      setProfileMessage(copy.profileSaved);
      router.refresh();
    } catch {
      setProfileError(copy.saveFailed);
    } finally {
      setProfileBusy(false);
    }
  }

  async function changeEmail() {
    setEmailBusy(true);
    setEmailError(null);
    setEmailMessage(null);
    try {
      const response = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setEmailError(body.error || copy.emailFailed);
        return;
      }
      setEmailMessage(copy.emailSent);
      setNextEmail("");
    } catch {
      setEmailError(copy.emailFailed);
    } finally {
      setEmailBusy(false);
    }
  }

  async function changePassword() {
    setPasswordBusy(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, currentPassword }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setPasswordError(body.error || copy.passwordFailed);
        return;
      }
      setPasswordMessage(copy.passwordSaved);
      setPassword("");
      setCurrentPassword("");
    } catch {
      setPasswordError(copy.passwordFailed);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function submitDeletion(action: "request" | "cancel") {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/account/deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "cancel" ? { action: "cancel" } : { reason }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setDeleteError(body.error || copy.deletionFailed);
        return;
      }
      setDeletionOpen(action === "request");
      if (action === "request") {
        setReason("");
      }
      router.refresh();
    } catch {
      setDeleteError(copy.deletionFailed);
    } finally {
      setDeleteBusy(false);
    }
  }

  const field = "h-[38px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] text-[#111827] outline-none focus:border-[#006C49]";
  const section = `${ui.card} flex flex-col gap-4 p-6`;

  return (
    <main className={`${ui.page} ${ui.pagePad}`}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <p className="text-[12px] font-semibold text-[#006C49]">{dash.nav.settings}</p>
          <h1 className={ui.title}>{copy.title}</h1>
          <p className={ui.subtitle}>{copy.subtitle}</p>
        </div>

        <section className={section}>
          <h2 className="text-[18px] font-semibold text-[#111827]">{copy.profileTitle}</h2>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6B7280]">{copy.name}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className={field} autoComplete="name" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6B7280]">{copy.timezone}</span>
            <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={field}>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          {props.isOwner ? (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-[#6B7280]">{copy.businessName}</span>
                <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-[#6B7280]">{copy.businessAddress}</span>
                <textarea
                  value={businessAddress}
                  onChange={(event) => setBusinessAddress(event.target.value)}
                  className="min-h-[88px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#111827] outline-none focus:border-[#006C49]"
                />
              </label>
            </>
          ) : null}
          {profileError ? <p className="text-[12px] text-[#DC2626]">{profileError}</p> : null}
          {profileMessage ? <p className="text-[12px] text-[#006C49]">{profileMessage}</p> : null}
          <button type="button" disabled={profileBusy} onClick={() => void saveProfile()} className={`${ui.btnPrimary} w-fit disabled:opacity-60`}>
            <PuyerBusyText busy={profileBusy} busyLabel={copy.saving} idle={copy.saveProfile} />
          </button>
        </section>

        <section className={section}>
          <h2 className="text-[18px] font-semibold text-[#111827]">{copy.emailTitle}</h2>
          <p className="text-[14px] leading-5 text-[#6B7280]">{copy.emailBody}</p>
          <p className="text-[14px] text-[#111827]">
            {copy.currentEmail}: <span className="font-medium">{props.email}</span>
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6B7280]">{copy.newEmail}</span>
            <input
              type="email"
              value={nextEmail}
              onChange={(event) => setNextEmail(event.target.value)}
              className={field}
              autoComplete="email"
            />
          </label>
          {emailError ? <p className="text-[12px] text-[#DC2626]">{emailError}</p> : null}
          {emailMessage ? <p className="text-[12px] text-[#006C49]">{emailMessage}</p> : null}
          <button type="button" disabled={emailBusy} onClick={() => void changeEmail()} className={`${ui.btnPrimary} w-fit disabled:opacity-60`}>
            <PuyerBusyText busy={emailBusy} busyLabel={copy.sending} idle={copy.sendEmailChange} />
          </button>
        </section>

        <section className={section}>
          <h2 className="text-[18px] font-semibold text-[#111827]">{copy.passwordTitle}</h2>
          <p className="text-[14px] leading-5 text-[#6B7280]">{copy.passwordBody}</p>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6B7280]">{copy.currentPassword}</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={field}
              autoComplete="current-password"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-[#6B7280]">{copy.newPassword}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={field}
              autoComplete="new-password"
            />
          </label>
          {passwordError ? <p className="text-[12px] text-[#DC2626]">{passwordError}</p> : null}
          {passwordMessage ? <p className="text-[12px] text-[#006C49]">{passwordMessage}</p> : null}
          <button type="button" disabled={passwordBusy} onClick={() => void changePassword()} className={`${ui.btnPrimary} w-fit disabled:opacity-60`}>
            <PuyerBusyText busy={passwordBusy} busyLabel={copy.saving} idle={copy.savePassword} />
          </button>
        </section>

        <section className={section}>
          <StripeSettings
            embedded
            isOwner={props.stripe.isOwner}
            status={props.stripe.status}
            chargesEnabled={props.stripe.chargesEnabled}
            canConnect={props.stripe.canConnect}
          />
        </section>

        <section className={section}>
          <h2 className="text-[18px] font-semibold text-[#111827]">{copy.moreTitle}</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/billing" className={ui.btnSecondary}>
              {dash.nav.billing}
            </a>
            <a href="/notifications" className={ui.btnSecondary}>
              {dash.nav.notifications}
            </a>
            <a href="/team" className={ui.btnSecondary}>
              {dash.nav.team}
            </a>
            <a href="/help" className={ui.btnSecondary}>
              {dash.nav.help}
            </a>
          </div>
        </section>

        <section className={section}>
          <h2 className="text-[18px] font-semibold text-[#111827]">{copy.dangerTitle}</h2>
          <p className="text-[14px] leading-5 text-[#6B7280]">{copy.dangerBody}</p>
          {deletionOpen ? (
            <>
              <p className="text-[14px] text-[#C2410C]">{copy.deletionPending}</p>
              {props.deletionCreatedAt ? (
                <p className="text-[12px] text-[#6B7280]">{copy.deletionRequestedAt.replace("{date}", props.deletionCreatedAt)}</p>
              ) : null}
              {deleteError ? <p className="text-[12px] text-[#DC2626]">{deleteError}</p> : null}
              <button type="button" disabled={deleteBusy} onClick={() => void submitDeletion("cancel")} className={`${ui.btnSecondary} w-fit disabled:opacity-60`}>
                <PuyerBusyText busy={deleteBusy} busyLabel={copy.saving} idle={copy.cancelDeletion} />
              </button>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-[13px] text-[#6B7280]">{copy.deletionReason}</span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="min-h-[88px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#111827] outline-none focus:border-[#006C49]"
                />
              </label>
              {deleteError ? <p className="text-[12px] text-[#DC2626]">{deleteError}</p> : null}
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void submitDeletion("request")}
                className="inline-flex h-10 w-fit items-center rounded-lg bg-[#b42318] px-4 text-[14px] font-semibold text-white disabled:opacity-60"
              >
                <PuyerBusyText busy={deleteBusy} busyLabel={copy.saving} idle={copy.requestDeletion} />
              </button>
            </>
          )}
        </section>

        <SignOutButton className="text-[13px] font-medium text-[#6B7280]" />
      </div>
    </main>
  );
}
