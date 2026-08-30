export type BanKind = "TEMPORARY" | "PERMANENT";
export type BanStatus = "ACTIVE" | "LIFTED";

export type BanRecord = {
  kind: BanKind;
  status: BanStatus;
  reason: string;
  endsAt: Date | null;
};

export function isBanInForce(ban: BanRecord, now = new Date()): boolean {
  if (ban.status !== "ACTIVE") {
    return false;
  }
  if (ban.kind === "PERMANENT") {
    return true;
  }
  if (!ban.endsAt) {
    return false;
  }
  return ban.endsAt.getTime() > now.getTime();
}

export function clipBanReason(input: string): string {
  return input.trim().replace(/\s+/g, " ").slice(0, 2000);
}

export function isUsableBanReason(input: string): boolean {
  const reason = clipBanReason(input);
  return reason.length >= 12;
}

export function formatAdminAccountLabel(input: {
  title: string;
  detail?: string;
  banned: boolean;
}): string {
  const parts = [input.title.trim(), input.detail?.trim() ?? ""].filter((part) => part.length > 0);
  if (input.banned) {
    parts.push("BAN");
  }
  return parts.join(" — ");
}
