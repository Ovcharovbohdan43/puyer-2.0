export type BanKind = "TEMPORARY" | "PERMANENT";
export type BanStatus = "ACTIVE" | "LIFTED";

export type BanForceFields = {
  kind: BanKind;
  status: BanStatus;
  endsAt: Date | null;
};

export type BanRecord = BanForceFields & {
  reason: string;
};

export function isBanInForce(ban: BanForceFields, now = new Date()): boolean {
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

export function formatAdminBanListLabel(input: {
  who: string;
  kind: BanKind;
  endsAt: Date | null;
  reason: string;
}): string {
  const when =
    input.kind === "TEMPORARY" && input.endsAt
      ? `TEMPORARY until ${input.endsAt.toISOString().slice(0, 10)}`
      : input.kind;
  const snippet = clipBanReason(input.reason).slice(0, 80);
  return formatAdminAccountLabel({
    title: input.who,
    detail: snippet ? `${when} · ${snippet}` : when,
    banned: false,
  });
}
