import { describe, expect, it } from "vitest";

import { can, requireEntitlement } from "@/lib/entitlements";
import { ForbiddenError } from "@/lib/errors";
import {
  DEFAULT_REMINDER_RULE,
  reminderIdempotencyKey,
  reminderTypesDue,
  shouldSkipReminderStatus,
  utcDateKey,
} from "@/lib/reminders/evaluate";

const due = new Date("2026-09-10T12:00:00.000Z");

describe("reminder skip rules", () => {
  it("never sends for PAID, CANCELED, or DRAFT", () => {
    expect(shouldSkipReminderStatus("PAID")).toBe(true);
    expect(shouldSkipReminderStatus("CANCELED")).toBe(true);
    expect(shouldSkipReminderStatus("DRAFT")).toBe(true);
    expect(shouldSkipReminderStatus("SENT")).toBe(false);
    expect(shouldSkipReminderStatus("OVERDUE")).toBe(false);
    expect(
      reminderTypesDue({
        status: "PAID",
        dueDate: due,
        now: due,
        rule: DEFAULT_REMINDER_RULE,
      }),
    ).toEqual([]);
    expect(
      reminderTypesDue({
        status: "CANCELED",
        dueDate: due,
        now: due,
        rule: DEFAULT_REMINDER_RULE,
      }),
    ).toEqual([]);
  });

  it("fires before, on, and after due on the matching UTC days", () => {
    expect(
      reminderTypesDue({
        status: "SENT",
        dueDate: due,
        now: new Date("2026-09-07T08:00:00.000Z"),
        rule: DEFAULT_REMINDER_RULE,
      }),
    ).toEqual(["BEFORE_DUE"]);
    expect(
      reminderTypesDue({
        status: "SENT",
        dueDate: due,
        now: new Date("2026-09-10T23:00:00.000Z"),
        rule: DEFAULT_REMINDER_RULE,
      }),
    ).toEqual(["ON_DUE"]);
    expect(
      reminderTypesDue({
        status: "OVERDUE",
        dueDate: due,
        now: new Date("2026-09-13T00:00:00.000Z"),
        rule: DEFAULT_REMINDER_RULE,
      }),
    ).toEqual(["AFTER_DUE"]);
    expect(
      reminderTypesDue({
        status: "SENT",
        dueDate: due,
        now: new Date("2026-09-11T00:00:00.000Z"),
        rule: DEFAULT_REMINDER_RULE,
      }),
    ).toEqual([]);
  });

  it("uses a stable idempotency key per invoice, type, and calendar day", () => {
    expect(reminderIdempotencyKey("inv", "ON_DUE", due)).toBe("reminder:inv:ON_DUE:2026-09-10");
    expect(reminderIdempotencyKey("inv", "ON_DUE", "2026-09-10")).toBe("reminder:inv:ON_DUE:2026-09-10");
    expect(utcDateKey(due)).toBe("2026-09-10");
  });

  it("blocks Free workspaces from automatic reminders", () => {
    expect(can({ plan: "FREE" }, "AUTOMATIC_REMINDERS")).toBe(false);
    expect(() => requireEntitlement({ plan: "FREE" }, "AUTOMATIC_REMINDERS")).toThrow(ForbiddenError);
    expect(can({ plan: "PRO" }, "AUTOMATIC_REMINDERS")).toBe(true);
  });
});
