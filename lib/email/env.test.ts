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
  it("finds a re_ value on RESEND_API_KEY including wrapping quotes", () => {
    const previous = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = '"re_test_from_quotes"';
    expect(findResendApiKey()).toBe("re_test_from_quotes");
    if (previous === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previous;
    }
  });

  it("finds a re_ value even when the env name is not RESEND_API_KEY", () => {
    const previousKey = process.env.RESEND_API_KEY;
    const previousMail = process.env.MAIL_PROVIDER_KEY;
    delete process.env.RESEND_API_KEY;
    process.env.MAIL_PROVIDER_KEY = "re_abcdefghijklmnop";
    expect(findResendApiKey()).toBe("re_abcdefghijklmnop");
    if (previousKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousKey;
    }
    if (previousMail === undefined) {
      delete process.env.MAIL_PROVIDER_KEY;
    } else {
      process.env.MAIL_PROVIDER_KEY = previousMail;
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
