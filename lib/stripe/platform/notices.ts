import "server-only";

import { prisma } from "@/lib/db/prisma";
import { sendBillingNoticeEmail } from "@/lib/email";
import { billingNoticeKind, type BillingSnapshot } from "@/lib/email/lifecycle";
import { logger } from "@/lib/observability/logger";

export async function notifyBillingOwners(input: {
  organizationId: string;
  stripeEventId: string;
  previous: BillingSnapshot | null;
  next: BillingSnapshot;
}): Promise<void> {
  const kind = billingNoticeKind(input.previous, input.next);
  if (!kind) {
    return;
  }
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      name: true,
      planSource: true,
      members: {
        where: { role: "OWNER" },
        select: { user: { select: { email: true, name: true } } },
      },
    },
  });
  if (!organization || organization.planSource === "MANUAL") {
    return;
  }
  const owners = organization.members.map((row) => row.user).filter((user) => user.email.includes("@"));
  for (const owner of owners) {
    try {
      await sendBillingNoticeEmail({
        to: owner.email,
        recipientName: owner.name ?? "",
        workspaceName: organization.name,
        kind,
        plan: input.next.plan,
        previousPlan: input.previous?.plan,
        idempotencyKey: `billing-notice:${input.organizationId}:${input.stripeEventId}:${kind}:${owner.email.toLowerCase()}`,
      });
    } catch {
      logger.warn("billing_notice_failed", { kind });
    }
  }
}
