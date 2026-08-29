import { NextResponse } from "next/server";

import { hasMagicLinkParams } from "@/lib/auth/complete-magic-link";
import { loginUrl } from "@/lib/auth/login-path";
import { magicLinkConfirmUrl, requestPublicOrigin } from "@/lib/auth/public-origin";

/** GoTrue Site URL confirmation path: /verify?token=&type=magiclink */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (hasMagicLinkParams(url.searchParams)) {
    return NextResponse.redirect(magicLinkConfirmUrl(request));
  }
  return NextResponse.redirect(new URL(loginUrl({ error: true }), requestPublicOrigin(request)));
}
