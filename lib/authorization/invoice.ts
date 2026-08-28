import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { SessionUser } from "@/lib/authorization";
import { requireOrganization } from "@/lib/authorization";
import { resolveTenantRecord } from "@/lib/authorization/tenant";

export async function requireInvoiceAccess(user: SessionUser, invoiceId: string) {
  const membership = await requireOrganization(user);
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: { orderBy: { sortOrder: "asc" } }, client: true },
  });
  return { membership, invoice: resolveTenantRecord(invoice, membership.organizationId) };
}
