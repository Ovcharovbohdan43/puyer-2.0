import "server-only";

import { prisma } from "@/lib/db/prisma";
import { isPayableStatus } from "@/lib/invoices/payable";
import type { Invoice } from "@prisma/client";

export type PublicPaymentOffer = {
  payable: boolean;
  connected: boolean;
  paid: boolean;
};

export async function getPublicPaymentOffer(invoice: Invoice): Promise<PublicPaymentOffer> {
  const connection = await prisma.stripeConnection.findUnique({
    where: { organizationId: invoice.organizationId },
    select: { status: true, chargesEnabled: true },
  });
  return {
    payable: isPayableStatus(invoice.status) && invoice.totalMinor > 0n,
    connected: connection?.status === "CONNECTED" && connection.chargesEnabled,
    paid: invoice.status === "PAID",
  };
}
