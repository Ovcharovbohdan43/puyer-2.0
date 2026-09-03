import "server-only";

import { timingSafeEqual } from "node:crypto";
import { cache } from "react";

import type { AccountBan, BanKind, BanTargetType } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db/prisma";
import { sendBanNoticeEmail } from "@/lib/email";
import { ForbiddenError, UnauthorizedError, ValidationError } from "@/lib/errors";
import { isBanInForce, isUsableBanReason, clipBanReason, formatAdminAccountLabel, formatAdminBanListLabel } from "@/lib/moderation/status";
import { logger } from "@/lib/observability/logger";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BannedError extends ForbiddenError {
  constructor() {
    super("This account is restricted.");
    this.name = "BannedError";
  }
}

export function assertPlatformAdmin(request: Request): void {
  const expected = (process.env.PLATFORM_ADMIN_SECRET ?? "").trim();
  if (expected.length < 32) {
    throw new UnauthorizedError();
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new UnauthorizedError();
  }
}

export const findActiveBanForUser = cache(async (userId: string): Promise<AccountBan | null> => {
  const [userBans, orgBans] = await Promise.all([
    prisma.accountBan.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.accountBan.findMany({
      where: {
        status: "ACTIVE",
        organization: { members: { some: { userId } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const now = new Date();
  return userBans.find((ban) => isBanInForce(ban, now)) ?? orgBans.find((ban) => isBanInForce(ban, now)) ?? null;
});

export async function assertNotBanned(userId: string): Promise<void> {
  const ban = await findActiveBanForUser(userId);
  if (ban) {
    throw new BannedError();
  }
}

export type AdminAccountListItem = {
  id: string;
  label: string;
};

export async function listAdminAccounts(targetType: BanTargetType): Promise<AdminAccountListItem[]> {
  const now = new Date();
  if (targetType === "USER") {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: {
        id: true,
        email: true,
        name: true,
        memberships: { select: { organization: { select: { name: true } } } },
        bans: { where: { status: "ACTIVE" }, select: { kind: true, status: true, endsAt: true } },
      },
    });
    return rows.map((row) => {
      const title = row.name ? `${row.email} (${row.name})` : row.email;
      const orgs = row.memberships.map((m) => m.organization.name).filter(Boolean).join(", ");
      const banned = row.bans.some((ban) => isBanInForce(ban, now));
      return { id: row.id, label: formatAdminAccountLabel({ title, detail: orgs || undefined, banned }) };
    });
  }
  const rows = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      id: true,
      name: true,
      plan: true,
      members: { select: { user: { select: { email: true } } } },
      bans: { where: { status: "ACTIVE" }, select: { kind: true, status: true, endsAt: true } },
    },
  });
  return rows.map((row) => {
    const emails = row.members.map((m) => m.user.email).join(", ");
    const banned = row.bans.some((ban) => isBanInForce(ban, now));
    return {
      id: row.id,
      label: formatAdminAccountLabel({
        title: row.name,
        detail: `${row.plan}${emails ? ` · ${emails}` : ""}`,
        banned,
      }),
    };
  });
}

export async function listAdminActiveBans(): Promise<AdminAccountListItem[]> {
  const now = new Date();
  const rows = await prisma.accountBan.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      kind: true,
      status: true,
      reason: true,
      endsAt: true,
      targetType: true,
      user: { select: { email: true, name: true } },
      organization: { select: { name: true } },
    },
  });
  return rows
    .filter((row) => isBanInForce(row, now))
    .map((row) => {
      const who =
        row.targetType === "USER"
          ? row.user
            ? row.user.name
              ? `${row.user.email} (${row.user.name})`
              : row.user.email
            : "Unknown user"
          : row.organization?.name ?? "Unknown workspace";
      return {
        id: row.id,
        label: formatAdminBanListLabel({
          who,
          kind: row.kind,
          endsAt: row.endsAt,
          reason: row.reason,
        }),
      };
    });
}

export async function applyAccountBan(input: {
  targetType: BanTargetType;
  userId?: string;
  organizationId?: string;
  kind: BanKind;
  reason: string;
  endsAt?: Date | null;
}): Promise<AccountBan> {
  const reason = clipBanReason(input.reason);
  if (!isUsableBanReason(reason)) {
    throw new ValidationError("Provide a clear ban reason (at least 12 characters).");
  }
  if (input.kind === "TEMPORARY") {
    if (!input.endsAt || Number.isNaN(input.endsAt.getTime()) || input.endsAt.getTime() <= Date.now()) {
      throw new ValidationError("A temporary ban needs an end date in the future.");
    }
  }
  if (input.kind === "PERMANENT" && input.endsAt) {
    throw new ValidationError("A permanent ban cannot have an end date.");
  }

  if (input.targetType === "USER") {
    if (!input.userId || !UUID_RE.test(input.userId)) {
      throw new ValidationError("A user ban needs a valid user id.");
    }
  } else if (!input.organizationId || !UUID_RE.test(input.organizationId)) {
    throw new ValidationError("An organization ban needs a valid organization id.");
  }

  const userId = input.targetType === "USER" ? input.userId! : null;
  const organizationId = input.targetType === "ORGANIZATION" ? input.organizationId! : null;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new ValidationError("That user was not found.");
    }
  }
  if (organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
    if (!org) {
      throw new ValidationError("That workspace was not found.");
    }
  }

  await prisma.accountBan.updateMany({
    where: {
      status: "ACTIVE",
      ...(userId ? { userId } : { organizationId }),
    },
    data: { status: "LIFTED", liftedAt: new Date() },
  });

  const ban = await prisma.accountBan.create({
    data: {
      targetType: input.targetType,
      kind: input.kind,
      status: "ACTIVE",
      reason,
      userId,
      organizationId,
      endsAt: input.kind === "TEMPORARY" ? input.endsAt! : null,
    },
  });

  await writeAuditLog({
    organizationId,
    action: "ACCOUNT_BANNED",
    entityType: input.targetType === "USER" ? "User" : "Organization",
    entityId: userId ?? organizationId,
    metadata: { kind: input.kind, reason },
  });

  try {
    await notifyBan(ban);
    await prisma.accountBan.update({
      where: { id: ban.id },
      data: { notifiedAt: new Date() },
    });
  } catch {
    logger.warn("ban_notice_failed", { banId: ban.id });
  }

  return ban;
}

export async function liftAccountBan(banId: string): Promise<AccountBan> {
  if (!UUID_RE.test(banId)) {
    throw new ValidationError("A valid ban id is required.");
  }
  const existing = await prisma.accountBan.findUnique({ where: { id: banId } });
  if (!existing) {
    throw new ValidationError("That ban was not found.");
  }
  const ban = await prisma.accountBan.update({
    where: { id: banId },
    data: { status: "LIFTED", liftedAt: new Date() },
  });
  await writeAuditLog({
    organizationId: ban.organizationId,
    action: "ACCOUNT_UNBANNED",
    entityType: ban.targetType === "USER" ? "User" : "Organization",
    entityId: ban.userId ?? ban.organizationId,
    metadata: { kind: ban.kind },
  });
  return ban;
}

async function notifyBan(ban: AccountBan): Promise<void> {
  const recipients: Array<{ email: string; name: string }> = [];
  if (ban.userId) {
    const user = await prisma.user.findUnique({
      where: { id: ban.userId },
      select: { email: true, name: true },
    });
    if (user) {
      recipients.push({ email: user.email, name: user.name ?? "" });
    }
  }
  if (ban.organizationId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: ban.organizationId },
      include: { user: { select: { email: true, name: true } } },
    });
    for (const member of members) {
      recipients.push({ email: member.user.email, name: member.user.name ?? "" });
    }
  }
  const unique = new Map<string, { email: string; name: string }>();
  for (const row of recipients) {
    unique.set(row.email.toLowerCase(), row);
  }
  for (const row of unique.values()) {
    await sendBanNoticeEmail({
      to: row.email,
      recipientName: row.name,
      kind: ban.kind,
      reason: ban.reason,
      endsAt: ban.endsAt,
      idempotencyKey: `ban-notice:${ban.id}:${row.email.toLowerCase()}`,
    });
  }
}
