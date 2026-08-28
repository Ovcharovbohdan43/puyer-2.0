import { afterEach, describe, expect, it, vi } from "vitest";

import { RateLimitError } from "@/lib/errors";
import { consumeRateLimit, requireRateLimit } from "@/lib/rate-limit/consume";
import { RATE_LIMITS } from "@/lib/rate-limit/policies";

describe("consumeRateLimit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("allows up to the policy max then blocks in-process", async () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    const now = Date.now();
    for (let i = 0; i < RATE_LIMITS["pay-public"].max; i += 1) {
      expect(await consumeRateLimit("pay-public", key, now)).toBe(true);
    }
    expect(await consumeRateLimit("pay-public", key, now)).toBe(false);
    await expect(requireRateLimit("pay-public", key, now)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("uses Upstash INCR when REST env is set", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ result: 1 }, { result: 1 }],
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await consumeRateLimit("otp-email", "ada@puyer.org", 1_000_000)).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as unknown[];
    expect(body[0]).toEqual(expect.arrayContaining(["INCR"]));
  });
});
