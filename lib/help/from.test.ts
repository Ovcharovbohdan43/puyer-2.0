import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_HELP_FROM, DEFAULT_HELP_INBOX, helpFromAddress, helpInboxAddress } from "@/lib/help/from";

describe("helpFromAddress", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the verified Help mailbox by default", () => {
    vi.stubEnv("EMAIL_FROM_HELP", "");
    vi.stubEnv("HELP_INBOX", "");
    expect(helpFromAddress()).toBe(DEFAULT_HELP_FROM);
    expect(helpInboxAddress()).toBe(DEFAULT_HELP_INBOX);
  });

  it("honors env overrides that contain an address", () => {
    vi.stubEnv("EMAIL_FROM_HELP", "Puyer Help <help@example.test>");
    vi.stubEnv("HELP_INBOX", "inbox@example.test");
    expect(helpFromAddress()).toBe("Puyer Help <help@example.test>");
    expect(helpInboxAddress()).toBe("inbox@example.test");
  });
});
