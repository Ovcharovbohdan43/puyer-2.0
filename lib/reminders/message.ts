export const MAX_REMINDER_BODY = 2000;

export function sanitizeReminderBody(raw: string): string {
  const normalized = raw.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const cleaned = [...normalized]
    .filter((char) => char === "\n" || char === "\t" || char >= " ")
    .join("");
  return cleaned.trim().slice(0, MAX_REMINDER_BODY);
}

export function reminderBodyLines(body: string): string[] {
  const lines = sanitizeReminderBody(body)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24);
  return lines.length > 0 ? lines : [];
}

export const DEFAULT_REMINDER_FROM = "Puyer Reminders <reminders@puyer.org>";

export function reminderFromAddress(): string {
  const configured = process.env.EMAIL_FROM_REMINDERS?.trim() ?? "";
  if (configured.includes("@")) {
    return configured;
  }
  return DEFAULT_REMINDER_FROM;
}
