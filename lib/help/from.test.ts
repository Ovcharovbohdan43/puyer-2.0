import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_HELP_FROM, DEFAULT_HELP_INBOX, helpFromAddress, helpInboxAddress } from "@/lib/help/from";

describe("helpFromAddress", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses a custom Help from when it is not the example help@ mailbox", () => {
    vi.stubEnv("EMAIL_FROM_HELP", "Support <support@puyer.org>");
    vi.stubEnv("EMAIL_FROM", "Puyer <noreply@puyer.org>");
    expect(helpFromAddress()).toBe("Support <support@puyer.org>");
  });

  it("sends from the verified EMAIL_FROM mailbox instead of unverified help@", () => {
    vi.stubEnv("EMAIL_FROM_HELP", DEFAULT_HELP_FROM);
    vi.stubEnv("EMAIL_FROM", "Puyer <noreply@puyer.org>");
    vi.stubEnv("EMAIL_FROM_INVITES", "");
    vi.stubEnv("EMAIL_FROM_REMINDERS", "");
    expect(helpFromAddress()).toBe("Puyer Help <noreply@puyer.org>");
  });

  it("falls back to the default Help from when no address is configured", () => {
    vi.stubEnv("EMAIL_FROM_HELP", "");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("EMAIL_FROM_INVITES", "");
    vi.stubEnv("EMAIL_FROM_REMINDERS", "");
    vi.stubEnv("HELP_INBOX", "");
    expect(helpFromAddress()).toBe(DEFAULT_HELP_FROM);
    expect(helpInboxAddress()).toBe(DEFAULT_HELP_INBOX);
  });

  it("honors HELP_INBOX when it contains an address", () => {
    vi.stubEnv("HELP_INBOX", "inbox@example.test");
    expect(helpInboxAddress()).toBe("inbox@example.test");
  });
});
