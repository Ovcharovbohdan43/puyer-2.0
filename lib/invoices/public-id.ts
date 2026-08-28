import { randomBytes } from "node:crypto";

const PUBLIC_ID_BYTES = 16;

export function createInvoicePublicId(): string {
  return randomBytes(PUBLIC_ID_BYTES).toString("base64url");
}

export function isInvoicePublicId(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,32}$/.test(value);
}
