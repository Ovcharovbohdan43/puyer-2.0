import { describe, expect, it } from "vitest";

import {
  hasMagicLinkParams,
  otpTypesToTry,
  tokenHashFromParams,
} from "@/lib/auth/complete-magic-link";

describe("magic link params", () => {
  it("accepts GoTrue token= as well as token_hash and PKCE code", () => {
    expect(hasMagicLinkParams(new URLSearchParams("code=abc"))).toBe(true);
    expect(hasMagicLinkParams(new URLSearchParams("token_hash=x&type=magiclink"))).toBe(true);
    expect(hasMagicLinkParams(new URLSearchParams("token=hashed&type=magiclink"))).toBe(true);
    expect(hasMagicLinkParams(new URLSearchParams())).toBe(false);
    expect(tokenHashFromParams(new URLSearchParams("token=hashed"))).toBe("hashed");
    expect(tokenHashFromParams(new URLSearchParams("token_hash=x&token=y"))).toBe("x");
  });

  it("tries the URL type first, then magiclink and email", () => {
    expect(otpTypesToTry("magiclink")[0]).toBe("magiclink");
    expect(otpTypesToTry("signup")).toEqual(["signup", "magiclink", "email"]);
    expect(otpTypesToTry(null)[0]).toBe("magiclink");
  });
});
