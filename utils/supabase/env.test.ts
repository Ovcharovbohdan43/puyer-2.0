import { afterEach, describe, expect, it } from "vitest";

import { getSupabasePublicEnv, trySupabasePublicEnv } from "@/utils/supabase/env";

describe("getSupabasePublicEnv", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });

  it("returns the public URL and publishable key when both are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

    expect(getSupabasePublicEnv()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("throws when either value is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

    expect(() => getSupabasePublicEnv()).toThrow(/Missing NEXT_PUBLIC_SUPABASE/);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(() => getSupabasePublicEnv()).toThrow(/Missing NEXT_PUBLIC_SUPABASE/);
  });

  it("returns null from trySupabasePublicEnv when unset", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    expect(trySupabasePublicEnv()).toBeNull();
  });
});
