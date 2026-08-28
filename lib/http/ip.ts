export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, 128);
    }
  }
  return request.headers.get("x-real-ip")?.trim().slice(0, 128) || "unknown";
}
