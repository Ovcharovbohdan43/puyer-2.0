import { type NextRequest, NextResponse } from "next/server";

import { loginUrl } from "@/lib/auth/login-path";
import { homeHasAuthCallbackParams } from "@/lib/auth/public-origin";
import { isProtectedPath } from "@/lib/auth/protected-routes";
import { clientIp } from "@/lib/http/ip";
import { consumeRateLimit } from "@/lib/rate-limit/consume";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (request.method === "GET" && homeHasAuthCallbackParams(path, request.nextUrl.searchParams)) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/auth/callback";
    return NextResponse.redirect(dest);
  }
  if (request.method === "GET" && path === "/" && request.nextUrl.searchParams.get("login") === "1") {
    return NextResponse.redirect(new URL(loginUrl(), request.url));
  }
  if (request.method === "GET" && path.startsWith("/invoice/")) {
    const ip = clientIp(request);
    const publicId = path.slice("/invoice/".length).split("/")[0] ?? "";
    if (!(await consumeRateLimit("invoice-page", `${ip}:${publicId}`))) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }
  const { response, signedIn } = await updateSession(request);
  if (isProtectedPath(path) && !signedIn) {
    return NextResponse.redirect(new URL(loginUrl(), request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|landing/|app/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
