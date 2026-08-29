import { describe, expect, it } from "vitest";

import { emailMailbox, envString } from "@/lib/email/env";

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

describe("emailMailbox", () => {
  it("extracts the address from a display-name from field", () => {
    expect(emailMailbox("Puyer <noreply@puyer.org>")).toBe("noreply@puyer.org");
    expect(emailMailbox("noreply@puyer.org")).toBe("noreply@puyer.org");
    expect(emailMailbox("Puyer Help")).toBeNull();
  });
});
