import { describe, expect, it } from "vitest";

import { reminderBodyLines, sanitizeReminderBody } from "@/lib/reminders/message";

describe("sanitizeReminderBody", () => {
  it("trims, strips control characters, and caps length", () => {
    expect(sanitizeReminderBody("  hi\u0000 there \r\nnext ")).toBe("hi there \nnext");
    expect(sanitizeReminderBody("x".repeat(2100)).length).toBe(2000);
  });
});

describe("reminderBodyLines", () => {
  it("drops blank lines", () => {
    expect(reminderBodyLines("a\n\n b \n")).toEqual(["a", "b"]);
  });
});
