export const DEFAULT_INVITE_FROM = "Puyer Team <invites@puyer.org>";

export function inviteFromAddress(): string {
  const configured = process.env.EMAIL_FROM_INVITES?.trim() ?? "";
  if (configured.includes("@")) {
    return configured;
  }
  return DEFAULT_INVITE_FROM;
}

export function inviteAcceptUrl(appOrigin: string, token: string): string {
  const origin = appOrigin.replace(/\/$/, "");
  return `${origin}/invite/${encodeURIComponent(token)}`;
}
