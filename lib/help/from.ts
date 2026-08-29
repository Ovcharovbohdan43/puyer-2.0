import { emailMailbox } from "@/lib/email/env";

export const DEFAULT_HELP_FROM = "Puyer Help <help@puyer.org>";
export const DEFAULT_HELP_INBOX = "support@puyer.org";

function isPlaceholderHelpFrom(value: string): boolean {
  return value === DEFAULT_HELP_FROM || /help@puyer\.org/i.test(value);
}

export function helpFromAddress(): string {
  const dedicated = process.env.EMAIL_FROM_HELP?.trim() ?? "";
  const general = process.env.EMAIL_FROM?.trim() ?? "";
  const invites = process.env.EMAIL_FROM_INVITES?.trim() ?? "";
  const reminders = process.env.EMAIL_FROM_REMINDERS?.trim() ?? "";
  if (dedicated.includes("@") && !isPlaceholderHelpFrom(dedicated)) {
    return dedicated;
  }
  const fallbackMailbox =
    emailMailbox(general) || emailMailbox(invites) || emailMailbox(reminders) || emailMailbox(dedicated);
  if (fallbackMailbox) {
    return `Puyer Help <${fallbackMailbox}>`;
  }
  return DEFAULT_HELP_FROM;
}

export function helpInboxAddress(): string {
  const configured = process.env.HELP_INBOX?.trim() ?? "";
  if (configured.includes("@")) {
    return configured;
  }
  return emailMailbox(process.env.EMAIL_FROM?.trim() ?? "") || DEFAULT_HELP_INBOX;
}
