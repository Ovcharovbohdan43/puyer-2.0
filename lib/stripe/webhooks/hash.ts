import { createHash } from "node:crypto";

export function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

export function isIsoCountry(value: string): boolean {
  return /^[A-Za-z]{2}$/.test(value.trim());
}
