import { ForbiddenError } from "@/lib/errors";

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function assertBrowserOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }
  const header = request.headers.get("origin");
  if (!header) {
    return;
  }
  const incoming = originOf(header);
  if (!incoming) {
    throw new ForbiddenError();
  }
  const allowed = new Set<string>();
  const requestOrigin = originOf(request.url);
  if (requestOrigin) {
    allowed.add(requestOrigin);
  }
  const app = process.env.NEXT_PUBLIC_APP_URL;
  if (app) {
    const appOrigin = originOf(app);
    if (appOrigin) {
      allowed.add(appOrigin);
    }
  }
  if (!allowed.has(incoming)) {
    throw new ForbiddenError();
  }
}
