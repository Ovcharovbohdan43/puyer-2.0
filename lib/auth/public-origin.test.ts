import { describe, expect, it } from "vitest";

import { supabaseAuthCookieOptions } from "@/lib/auth/supabase-cookies";
import {
  homeHasAuthCallbackParams,
  isLocalOrigin,
  magicLinkConfirmUrl,
  magicLinkEmailRedirectTo,
  magicLinkRedirectOrigin,
  requestPublicOrigin,
  shouldOpenDashboardAfterImplicitMagicLink,
} from "@/lib/auth/public-origin";

describe("magic link redirect origin", () => {
  it("uses the request host so PKCE cookies match the callback", () => {
    const request = new Request("https://puyer.org/api/auth/otp", {
      headers: { "x-forwarded-host": "puyer.org", "x-forwarded-proto": "https" },
    });
    expect(requestPublicOrigin(request)).toBe("https://puyer.org");
    expect(magicLinkEmailRedirectTo(request)).toBe("https://puyer.org/auth/confirm");
  });

  it("ignores localhost APP_URL on a public host", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    const request = new Request("https://www.puyer.org/api/auth/otp", {
      headers: { "x-forwarded-host": "www.puyer.org", "x-forwarded-proto": "https" },
    });
    expect(isLocalOrigin("http://localhost:3000")).toBe(true);
    expect(magicLinkRedirectOrigin(request)).toBe("https://www.puyer.org");
    process.env.NEXT_PUBLIC_APP_URL = previous;
  });
});

describe("auth landing fallbacks", () => {
  it("forwards homepage PKCE or token_hash to the callback", () => {
    expect(homeHasAuthCallbackParams("/", new URLSearchParams("code=abc"))).toBe(true);
    expect(homeHasAuthCallbackParams("/", new URLSearchParams("token=hashed&type=magiclink"))).toBe(true);
    expect(homeHasAuthCallbackParams("/", new URLSearchParams())).toBe(false);
    expect(homeHasAuthCallbackParams("/login", new URLSearchParams("code=abc"))).toBe(false);
  });

  it("moves callback query params onto /auth/confirm without consuming the token", () => {
    const request = new Request("https://www.puyer.org/auth/callback?token=hashed&type=magiclink");
    expect(magicLinkConfirmUrl(request).toString()).toBe(
      "https://www.puyer.org/auth/confirm?token=hashed&type=magiclink",
    );
  });

  it("sends implicit hash sessions on / to the dashboard", () => {
    expect(shouldOpenDashboardAfterImplicitMagicLink("/", "#access_token=jwt", "")).toBe(true);
    expect(shouldOpenDashboardAfterImplicitMagicLink("/", "#access_token=jwt", "?resume=download")).toBe(
      false,
    );
    expect(shouldOpenDashboardAfterImplicitMagicLink("/pricing", "#access_token=jwt", "")).toBe(false);
  });
});

describe("supabase auth cookies", () => {
  it("shares cookies across puyer.org and www.puyer.org", () => {
    expect(supabaseAuthCookieOptions("puyer.org")).toEqual({ domain: ".puyer.org" });
    expect(supabaseAuthCookieOptions("www.puyer.org")).toEqual({ domain: ".puyer.org" });
    expect(supabaseAuthCookieOptions("localhost")).toEqual({});
  });
});
