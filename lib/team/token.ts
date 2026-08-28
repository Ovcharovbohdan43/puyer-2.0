import { createHash, randomBytes } from "node:crypto";

import { INVITE_TOKEN_PATTERN } from "@/lib/authorization/permissions";

export function createInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isInviteTokenFormat(token: string): boolean {
  return INVITE_TOKEN_PATTERN.test(token);
}
