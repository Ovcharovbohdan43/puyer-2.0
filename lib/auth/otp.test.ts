import { describe, expect, it } from "vitest";

import { loginUrl } from "@/lib/auth/login-path";
import { allowOtpAttempt, OTP_MAX_PER_WINDOW } from "@/lib/auth/otp-limit";
import { returnToForIntent, sanitizeReturnTo } from "@/lib/auth/return-to";

describe("OTP rate limit", () => {
  it("allows the first attempts then blocks", () => {
    const hits = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < OTP_MAX_PER_WINDOW; i += 1) {
      expect(allowOtpAttempt(hits, "Alex@Puyer.org", now + i)).toBe(true);
    }
    expect(allowOtpAttempt(hits, "alex@puyer.org", now + OTP_MAX_PER_WINDOW)).toBe(false);
  });

  it("resets after the window", () => {
    const hits = new Map<string, number[]>();
    const now = 1_000_000;
    for (let i = 0; i < OTP_MAX_PER_WINDOW; i += 1) {
      allowOtpAttempt(hits, "a@b.co", now, 1_000, 2);
    }
    expect(allowOtpAttempt(hits, "a@b.co", now + 1, 1_000, 2)).toBe(false);
    expect(allowOtpAttempt(hits, "a@b.co", now + 1_001, 1_000, 2)).toBe(true);
  });
});

describe("auth return path", () => {
  it("maps intents", () => {
    expect(returnToForIntent("login")).toBe("/dashboard");
    expect(returnToForIntent("download")).toBe("/?resume=download");
    expect(returnToForIntent("share")).toBe("/?resume=share");
    expect(returnToForIntent("subscribe")).toBe("/pricing");
  });

  it("rejects open redirects", () => {
    expect(sanitizeReturnTo("https://evil.example")).toBe("/dashboard");
    expect(sanitizeReturnTo("/pricing")).toBe("/pricing");
    expect(sanitizeReturnTo("/dashboard")).toBe("/dashboard");
    expect(sanitizeReturnTo("/invite/" + "ab".repeat(32))).toBe("/invite/" + "ab".repeat(32));
    expect(sanitizeReturnTo("/invite/not-a-token")).toBe("/dashboard");
  });
});

describe("login path", () => {
  it("builds /login with optional error and subscribe intent", () => {
    expect(loginUrl()).toBe("/login");
    expect(loginUrl({ error: true })).toBe("/login?error=1");
    expect(loginUrl({ intent: "subscribe" })).toBe("/login?intent=subscribe");
    expect(loginUrl({ intent: "login" })).toBe("/login");
  });
});
