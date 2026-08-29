import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/observability/logger";

describe("logger redaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts secret field names and keeps non-secret values", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("probe", {
      authorization: "Bearer secret-token",
      email: "alex@puyer.org",
    });
    const line = String(info.mock.calls[0]?.[0]);
    expect(line).toContain("[redacted]");
    expect(line).not.toContain("secret-token");
    expect(line).toContain("alex@puyer.org");
  });

  it("does not redact keyPresent used by email skip logs", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    logger.warn("email_skipped_unconfigured", { keyPresent: false, fromPresent: true });
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toContain("\"keyPresent\":false");
    expect(line).toContain("\"fromPresent\":true");
  });

  it("redacts Stripe secret values even when the field name is generic", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("probe", { key: "sk_test_not_a_real_secret", note: "ok" });
    const line = String(info.mock.calls[0]?.[0]);
    expect(line).toContain("[redacted]");
    expect(line).not.toContain("sk_test_not_a_real_secret");
    expect(line).toContain("ok");
  });
});
