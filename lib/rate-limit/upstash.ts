type PipelineResult = Array<{ result?: unknown }>;

function upstashEnv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return null;
  }
  return { url: url.replace(/\/$/, ""), token };
}

export async function allowUpstash(
  key: string,
  windowMs: number,
  max: number,
  now = Date.now(),
): Promise<boolean | null> {
  const env = upstashEnv();
  if (!env) {
    return null;
  }
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const slot = Math.floor(now / windowMs);
  const redisKey = `puyer:rl:${key}:${slot}`;
  try {
    const response = await fetch(`${env.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSec), "NX"],
      ]),
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as PipelineResult;
    const count = payload[0]?.result;
    return typeof count === "number" && count <= max;
  } catch {
    return null;
  }
}
