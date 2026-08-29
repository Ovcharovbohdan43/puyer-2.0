import { describe, expect, it } from "vitest";

import { emailMailbox, envString, findResendApiKey } from "@/lib/email/env";

describe("envString", () => {
  it("reads by name so values are not build-time inlined", () => {
    const previous = process.env.PUYER_ENV_PROBE;
    process.env.PUYER_ENV_PROBE = "  secret-value  ";
    expect(envString("PUYER_ENV_PROBE")).toBe("secret-value");
    if (previous === undefined) {
      delete process.env.PUYER_ENV_PROBE;
    } else {
      process.env.PUYER_ENV_PROBE = previous;
    }
  });
});

describe("findResendApiKey", () => {
  it("finds a re_ value on any RESEND_* name without a static env lookup", () => {
    const previous = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = '"re_test_from_quotes"';
    expect(findResendApiKey()).toBe("re_test_from_quotes");
    if (previous === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous;
    }
  });
});

describe("emailMailbox", () => {
  it("extracts the address from a display-name from field", () => {
    expect(emailMailbox("Puyer <noreply@puyer.org>")).toBe("noreply@puyer.org");
    expect(emailMailbox("noreply@puyer.org")).toBe("noreply@puyer.org");
    expect(emailMailbox("Puyer Help")).toBeNull();
  });
});
