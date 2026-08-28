import "server-only";

import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function notifyOrganizationMembers(input: {
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: input.organizationId },
    include: { user: { include: { notificationPreferences: true } } },
  });
  const rows = members
    .filter((member) => {
      const pref = member.user.notificationPreferences.find(
        (item) => item.organizationId === input.organizationId,
      );
      return pref?.inAppEnabled !== false;
    })
    .map((member) => ({
      userId: member.userId,
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    }));
  if (rows.length === 0) {
    return;
  }
  await prisma.notification.createMany({ data: rows });
}

export async function listUserNotifications(userId: string, organizationId: string) {
  return prisma.notification.findMany({
    where: { userId, organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(userId: string, organizationId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId, organizationId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(userId: string, organizationId: string) {
  await prisma.notification.updateMany({
    where: { userId, organizationId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function getNotificationPreference(userId: string, organizationId: string) {
  return prisma.notificationPreference.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    create: { userId, organizationId },
    update: {},
  });
}

export async function updateNotificationPreference(
  userId: string,
  organizationId: string,
  data: { emailEnabled?: boolean; inAppEnabled?: boolean },
) {
  return prisma.notificationPreference.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    create: {
      userId,
      organizationId,
      emailEnabled: data.emailEnabled ?? true,
      inAppEnabled: data.inAppEnabled ?? true,
    },
    update: data,
  });
}
