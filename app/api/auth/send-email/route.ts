import { handleSendEmailHook } from "@/lib/email/send-email-hook";
import { clientIp } from "@/lib/http/ip";
import { consumeRateLimit } from "@/lib/rate-limit/consume";

export async function POST(request: Request) {
  if (!(await consumeRateLimit("auth-email-hook", clientIp(request)))) {
    return Response.json({ error: { http_code: 429, message: "Too many requests." } }, { status: 429 });
  }
  return handleSendEmailHook(request);
}
