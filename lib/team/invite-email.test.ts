import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_INVITE_FROM, inviteAcceptUrl, inviteFromAddress } from "@/lib/team/invite-email";

describe("inviteFromAddress", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses a custom Team from when it is not the example invites@ mailbox", () => {
    vi.stubEnv("EMAIL_FROM_INVITES", "Puyer <team@puyer.org>");
    vi.stubEnv("EMAIL_FROM", "Puyer <noreply@puyer.org>");
    expect(inviteFromAddress()).toBe("Puyer <team@puyer.org>");
  });

  it("sends from the verified EMAIL_FROM mailbox instead of unverified invites@", () => {
    vi.stubEnv("EMAIL_FROM_INVITES", DEFAULT_INVITE_FROM);
    vi.stubEnv("EMAIL_FROM", "Puyer <noreply@puyer.org>");
    vi.stubEnv("EMAIL_FROM_HELP", "");
    vi.stubEnv("EMAIL_FROM_REMINDERS", "");
    expect(inviteFromAddress()).toBe("Puyer Team <noreply@puyer.org>");
  });

  it("treats a bare invites@ mailbox as the example address", () => {
    vi.stubEnv("EMAIL_FROM_INVITES", "invites@puyer.org");
    vi.stubEnv("EMAIL_FROM", "billing@puyer.org");
    vi.stubEnv("EMAIL_FROM_HELP", "");
    vi.stubEnv("EMAIL_FROM_REMINDERS", "");
    expect(inviteFromAddress()).toBe("Puyer Team <billing@puyer.org>");
  });

  it("falls back to the default invites mailbox when no address is configured", () => {
    vi.stubEnv("EMAIL_FROM_INVITES", "");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("EMAIL_FROM_HELP", "");
    vi.stubEnv("EMAIL_FROM_REMINDERS", "");
    expect(inviteFromAddress()).toBe(DEFAULT_INVITE_FROM);
  });
});

describe("inviteAcceptUrl", () => {
  it("builds a production invite path from the request origin", () => {
    expect(inviteAcceptUrl("https://puyer.org/", "ab".repeat(32))).toBe(
      `https://puyer.org/invite/${"ab".repeat(32)}`,
    );
  });
});
