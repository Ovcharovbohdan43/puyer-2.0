import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_INVITE_FROM, inviteAcceptUrl, inviteFromAddress } from "@/lib/team/invite-email";

describe("inviteFromAddress", () => {
  const previous = process.env.EMAIL_FROM_INVITES;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.EMAIL_FROM_INVITES;
    } else {
      process.env.EMAIL_FROM_INVITES = previous;
    }
  });

  it("defaults to the verified Puyer invites mailbox", () => {
    delete process.env.EMAIL_FROM_INVITES;
    expect(inviteFromAddress()).toBe(DEFAULT_INVITE_FROM);
  });

  it("uses EMAIL_FROM_INVITES when it contains an address", () => {
    process.env.EMAIL_FROM_INVITES = "Puyer <team@puyer.org>";
    expect(inviteFromAddress()).toBe("Puyer <team@puyer.org>");
  });
});

describe("inviteAcceptUrl", () => {
  it("builds a production invite path from the request origin", () => {
    expect(inviteAcceptUrl("https://puyer.org/", "ab".repeat(32))).toBe(
      `https://puyer.org/invite/${"ab".repeat(32)}`,
    );
  });
});
