export function allowAttempt(
  hits: Map<string, number[]>,
  key: string,
  now = Date.now(),
  windowMs: number,
  max: number,
): boolean {
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((stamp) => stamp > cutoff);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

const memoryHits = new Map<string, number[]>();

export function allowInProcess(
  bucket: string,
  key: string,
  windowMs: number,
  max: number,
  now = Date.now(),
): boolean {
  return allowAttempt(memoryHits, `${bucket}:${key}`, now, windowMs, max);
}
