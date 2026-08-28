import { handleStripeWebhook } from "@/lib/stripe/webhooks/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleStripeWebhook(request, "CONNECT", process.env.STRIPE_WEBHOOK_SECRET_CONNECT);
}
