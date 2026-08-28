import { type NextRequest, NextResponse } from "next/server";

import { isProtectedPath } from "@/lib/auth/protected-routes";
import { clientIp } from "@/lib/http/ip";
import { consumeRateLimit } from "@/lib/rate-limit/consume";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (request.method === "GET" && path.startsWith("/invoice/")) {
    const ip = clientIp(request);
    const publicId = path.slice("/invoice/".length).split("/")[0] ?? "";
    if (!(await consumeRateLimit("invoice-page", `${ip}:${publicId}`))) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }
  const { response, signedIn } = await updateSession(request);
  if (isProtectedPath(path) && !signedIn) {
    const login = new URL("/", request.url);
    login.searchParams.set("login", "1");
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|landing/|app/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
