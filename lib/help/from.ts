import { emailMailbox, envString } from "@/lib/email/env";

export const DEFAULT_HELP_FROM = "Puyer Help <help@puyer.org>";
export const DEFAULT_HELP_INBOX = "support@puyer.org";

function isPlaceholderHelpFrom(value: string): boolean {
  return value === DEFAULT_HELP_FROM || /help@puyer\.org/i.test(value);
}

export function helpFromAddress(): string {
  const dedicated = envString("EMAIL_FROM_HELP");
  const general = envString("EMAIL_FROM");
  const invites = envString("EMAIL_FROM_INVITES");
  const reminders = envString("EMAIL_FROM_REMINDERS");
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
  const configured = envString("HELP_INBOX");
  if (configured.includes("@")) {
    return configured;
  }
  return emailMailbox(envString("EMAIL_FROM")) || DEFAULT_HELP_INBOX;
}
