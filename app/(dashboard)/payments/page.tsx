import { requireOrganization, requireSession } from "@/lib/authorization";
import { logger } from "@/lib/observability/logger";
import { toPaymentListRow } from "@/lib/payments/present";
import { listOrganizationPayments } from "@/lib/payments/sync";
import { PaymentsScreen } from "@/components/dashboard/payments-screen";

export default async function PaymentsPage() {
  const session = await requireSession();
  let rows: ReturnType<typeof toPaymentListRow>[] = [];
  try {
    const membership = await requireOrganization(session);
    rows = (await listOrganizationPayments(membership.organizationId)).map(toPaymentListRow);
  } catch {
    logger.warn("payments_list_unavailable");
  }

  return <PaymentsScreen rows={rows} />;
}
