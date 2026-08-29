import type { InvoiceStatus } from "@prisma/client";

export const DEFAULT_DAYS_BEFORE_DUE = 3;
export const DEFAULT_DAYS_AFTER_DUE = 3;

export type ReminderKind = "BEFORE_DUE" | "ON_DUE" | "AFTER_DUE";

export type ReminderRuleSnapshot = {
  enabled: boolean;
  daysBeforeDue: number;
  onDue: boolean;
  daysAfterDue: number;
};

export const DEFAULT_REMINDER_RULE: ReminderRuleSnapshot = {
  enabled: true,
  daysBeforeDue: DEFAULT_DAYS_BEFORE_DUE,
  onDue: true,
  daysAfterDue: DEFAULT_DAYS_AFTER_DUE,
};

export function utcDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function addUtcDays(value: Date, days: number): Date {
  const date = utcDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export function utcDateKey(value: Date): string {
  return utcDateOnly(value).toISOString().slice(0, 10);
}

export function shouldSkipReminderStatus(status: InvoiceStatus): boolean {
  return status === "PAID" || status === "CANCELED" || status === "DRAFT";
}

export function reminderTypesDue(input: {
  status: InvoiceStatus;
  dueDate: Date;
  now: Date;
  rule: ReminderRuleSnapshot;
}): ReminderKind[] {
  if (!input.rule.enabled || shouldSkipReminderStatus(input.status)) {
    return [];
  }
  const today = utcDateOnly(input.now);
  const due = utcDateOnly(input.dueDate);
  const types: ReminderKind[] = [];
  if (input.rule.daysBeforeDue > 0 && datesEqual(today, addUtcDays(due, -input.rule.daysBeforeDue))) {
    types.push("BEFORE_DUE");
  }
  if (input.rule.onDue && datesEqual(today, due)) {
    types.push("ON_DUE");
  }
  if (input.rule.daysAfterDue > 0 && datesEqual(today, addUtcDays(due, input.rule.daysAfterDue))) {
    types.push("AFTER_DUE");
  }
  return types;
}

export function reminderIdempotencyKey(
  invoiceId: string,
  type: ReminderKind | "MANUAL",
  scheduledDate: Date | string,
): string {
  const date = typeof scheduledDate === "string" ? scheduledDate.slice(0, 10) : utcDateKey(scheduledDate);
  return `reminder:${invoiceId}:${type}:${date}`;
}

function datesEqual(left: Date, right: Date): boolean {
  return left.getTime() === right.getTime();
}
