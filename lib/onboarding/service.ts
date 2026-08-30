import "server-only";

import type { SessionUser } from "@/lib/authorization";
import { requireOrganization } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import type { OnboardingInput } from "@/lib/onboarding/input";

export async function completeOnboarding(user: SessionUser, input: OnboardingInput): Promise<void> {
  const membership = await requireOrganization(user);
  if (membership.user.onboardingCompletedAt) {
    return;
  }

  const isOwner = membership.role === "OWNER";
  if (isOwner && input.businessName.length < 2) {
    throw new ValidationError("Enter your business name.");
  }

  const now = new Date();
  const addClient = Boolean(input.clientName && input.clientEmail && isOwner);

  let createdClientId: string | null = null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        timezone: input.timezone,
        onboardingCompletedAt: now,
      },
    });
    if (!isOwner) {
      return;
    }
    await tx.businessProfile.update({
      where: { organizationId: membership.organizationId },
      data: {
        businessName: input.businessName,
        businessAddress: input.businessAddress,
        defaultCurrency: input.currency,
        defaultTaxRate: input.taxRate,
      },
    });
    await tx.organization.update({
      where: { id: membership.organizationId },
      data: { name: input.businessName },
    });
    if (addClient) {
      const client = await tx.client.create({
        data: {
          organizationId: membership.organizationId,
          name: input.clientName,
          email: input.clientEmail,
        },
      });
      createdClientId = client.id;
    }
  });

  if (createdClientId) {
    await writeAuditLog({
      actorUserId: user.id,
      organizationId: membership.organizationId,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: createdClientId,
    });
  }

  logger.info("onboarding_completed", { owner: isOwner });
}
