import "server-only";

import { can } from "@/lib/entitlements";
import { effectivePlan } from "@/lib/entitlements";
import { prisma } from "@/lib/db/prisma";
import { platformPriceToPlan } from "@/lib/stripe/platform/prices";
import {
  DEFAULT_REMINDER_RULE,
  addUtcDays,
  reminderTypesDue,
  utcDateKey,
  utcDateOnly,
  type ReminderKind,
  type ReminderRuleSnapshot,
} from "@/lib/reminders/evaluate";

export type DueReminder = {
  invoiceId: string;
  type: ReminderKind;
  scheduledDate: string;
};

export async function listDueReminders(now = new Date()): Promise<DueReminder[]> {
  const due: DueReminder[] = [];
  const organizations = await prisma.organization.findMany({
    include: { subscription: true, reminderRule: true },
  });
  const prices = platformPriceToPlan();
  const eligible = organizations.filter((org) => {
    const plan = effectivePlan(
      org.subscription
        ? {
            status: org.subscription.status,
            stripePriceId: org.subscription.stripePriceId,
            currentPeriodEnd: org.subscription.currentPeriodEnd,
          }
        : null,
      prices,
      now,
    );
    return can({ plan }, "AUTOMATIC_REMINDERS");
  });
  if (eligible.length === 0) {
    return [];
  }
  const maxBefore = Math.max(...eligible.map((org) => org.reminderRule?.daysBeforeDue ?? DEFAULT_REMINDER_RULE.daysBeforeDue), 0);
  const maxAfter = Math.max(...eligible.map((org) => org.reminderRule?.daysAfterDue ?? DEFAULT_REMINDER_RULE.daysAfterDue), 0);
  const today = utcDateOnly(now);
  const windowStart = addUtcDays(today, -maxAfter);
  const windowEnd = addUtcDays(today, maxBefore);

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: { in: eligible.map((org) => org.id) },
      status: { notIn: ["PAID", "CANCELED", "DRAFT"] },
      dueDate: { gte: windowStart, lte: windowEnd },
    },
    select: {
      id: true,
      organizationId: true,
      status: true,
      dueDate: true,
    },
  });
  const rules = new Map<string, ReminderRuleSnapshot>(
    eligible.map((org) => [
      org.id,
      org.reminderRule
        ? {
            enabled: org.reminderRule.enabled,
            daysBeforeDue: org.reminderRule.daysBeforeDue,
            onDue: org.reminderRule.onDue,
            daysAfterDue: org.reminderRule.daysAfterDue,
          }
        : DEFAULT_REMINDER_RULE,
    ]),
  );

  for (const invoice of invoices) {
    const rule = rules.get(invoice.organizationId) ?? DEFAULT_REMINDER_RULE;
    const types = reminderTypesDue({
      status: invoice.status,
      dueDate: invoice.dueDate,
      now,
      rule,
    });
    const scheduledDate = utcDateKey(now);
    for (const type of types) {
      due.push({ invoiceId: invoice.id, type, scheduledDate });
    }
  }
  return due;
}
