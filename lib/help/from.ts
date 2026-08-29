export const DEFAULT_HELP_FROM = "Puyer Help <help@puyer.org>";
export const DEFAULT_HELP_INBOX = "support@puyer.org";

export function helpFromAddress(): string {
  const configured = process.env.EMAIL_FROM_HELP?.trim() ?? "";
  if (configured.includes("@")) {
    return configured;
  }
  return DEFAULT_HELP_FROM;
}

export function helpInboxAddress(): string {
  const configured = process.env.HELP_INBOX?.trim() ?? "";
  if (configured.includes("@")) {
    return configured;
  }
  return DEFAULT_HELP_INBOX;
}
