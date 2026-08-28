import { NextResponse } from "next/server";

import { requireSession } from "@/lib/authorization";
import { toPublicError } from "@/lib/errors";
import { assertBrowserOrigin } from "@/lib/http/origin";
import { logger } from "@/lib/observability/logger";

export async function handleRoute(run: () => Promise<Response>, request?: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    if (request) {
      assertBrowserOrigin(request);
    }
    const response = await run();
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const publicError = toPublicError(error);
    if (publicError.status >= 500) {
      logger.error("api_unhandled", {
        requestId,
        errorName: error instanceof Error ? error.name : "unknown",
      });
    }
    const body = NextResponse.json({ ok: false, error: publicError.message }, { status: publicError.status });
    body.headers.set("x-request-id", requestId);
    return body;
  }
}

export async function requireApiSession() {
  return requireSession();
}
