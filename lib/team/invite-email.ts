import { emailMailbox, envString } from "@/lib/email/env";

export const DEFAULT_INVITE_FROM = "Puyer Team <invites@puyer.org>";

function isPlaceholderInviteFrom(value: string): boolean {
  return value === DEFAULT_INVITE_FROM || /invites@puyer\.org/i.test(value);
}

export function inviteFromAddress(): string {
  const dedicated = envString("EMAIL_FROM_INVITES");
  const general = envString("EMAIL_FROM");
  const help = envString("EMAIL_FROM_HELP");
  const reminders = envString("EMAIL_FROM_REMINDERS");
  if (dedicated.includes("@") && !isPlaceholderInviteFrom(dedicated)) {
    return dedicated;
  }
  const fallbackMailbox =
    emailMailbox(general) || emailMailbox(help) || emailMailbox(reminders) || emailMailbox(dedicated);
  if (fallbackMailbox && !/invites@puyer\.org/i.test(fallbackMailbox)) {
    return `Puyer Team <${fallbackMailbox}>`;
  }
  return DEFAULT_INVITE_FROM;
}

export function inviteAcceptUrl(appOrigin: string, token: string): string {
  const origin = appOrigin.replace(/\/$/, "");
  return `${origin}/invite/${encodeURIComponent(token)}`;
}
