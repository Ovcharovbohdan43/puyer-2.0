import { RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import { allowInProcess } from "@/lib/rate-limit/memory";
import { RATE_LIMITS, type RateLimitPolicy } from "@/lib/rate-limit/policies";
import { allowUpstash } from "@/lib/rate-limit/upstash";

export async function consumeRateLimit(
  policy: RateLimitPolicy,
  key: string,
  now = Date.now(),
): Promise<boolean> {
  const { windowMs, max } = RATE_LIMITS[policy];
  const distributed = await allowUpstash(`${policy}:${key}`, windowMs, max, now);
  if (distributed !== null) {
    return distributed;
  }
  return allowInProcess(policy, key, windowMs, max, now);
}

export async function requireRateLimit(policy: RateLimitPolicy, key: string, now = Date.now()): Promise<void> {
  const allowed = await consumeRateLimit(policy, key, now);
  if (!allowed) {
    logger.warn("rate_limited", { policy });
    throw new RateLimitError();
  }
}
