import { describe, expect, it } from "vitest";

import {
  hasSupabaseCookies,
  shouldRedirectProtectedWithoutSession,
  shouldRefreshAuthSession,
} from "@/lib/auth/session-refresh";

describe("session refresh gate", () => {
  it("detects Supabase SSR cookie names including chunked tokens", () => {
    expect(hasSupabaseCookies([])).toBe(false);
    expect(hasSupabaseCookies(["theme"])).toBe(false);
    expect(hasSupabaseCookies(["sb-xxxx-auth-token"])).toBe(true);
    expect(hasSupabaseCookies(["sb-xxxx-auth-token.0"])).toBe(true);
  });

  it("skips getClaims for anonymous marketing, help, and webhooks", () => {
    expect(shouldRefreshAuthSession({ path: "/", cookieNames: [] })).toBe(false);
    expect(shouldRefreshAuthSession({ path: "/pricing", cookieNames: [] })).toBe(false);
    expect(shouldRefreshAuthSession({ path: "/help", cookieNames: [] })).toBe(false);
    expect(shouldRefreshAuthSession({ path: "/login", cookieNames: [] })).toBe(false);
    expect(shouldRefreshAuthSession({ path: "/api/stripe/webhooks/platform", cookieNames: [] })).toBe(
      false,
    );
  });

  it("refreshes when Auth cookies exist on any path", () => {
    const cookieNames = ["sb-xxxx-auth-token"];
    expect(shouldRefreshAuthSession({ path: "/", cookieNames })).toBe(true);
    expect(shouldRefreshAuthSession({ path: "/dashboard", cookieNames })).toBe(true);
    expect(shouldRefreshAuthSession({ path: "/api/invoices", cookieNames })).toBe(true);
  });

  it("redirects protected routes immediately when no Auth cookies are present", () => {
    expect(shouldRedirectProtectedWithoutSession({ path: "/dashboard", cookieNames: [] })).toBe(true);
    expect(shouldRedirectProtectedWithoutSession({ path: "/invoices/new", cookieNames: [] })).toBe(
      true,
    );
    expect(shouldRedirectProtectedWithoutSession({ path: "/", cookieNames: [] })).toBe(false);
    expect(
      shouldRedirectProtectedWithoutSession({
        path: "/dashboard",
        cookieNames: ["sb-xxxx-auth-token"],
      }),
    ).toBe(false);
  });
});
