import { NotificationsScreen } from "@/components/dashboard/notifications-screen";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { can } from "@/lib/entitlements";
import { planFromOrganization } from "@/lib/entitlements/load";
import { getNotificationPreference, listUserNotifications } from "@/lib/notifications";
import { logger } from "@/lib/observability/logger";

export default async function NotificationsPage() {
  const session = await requireSession();
  try {
    const membership = await requireOrganization(session);
    const plan = planFromOrganization(membership.organization);
    const [items, pref] = await Promise.all([
      listUserNotifications(session.id, membership.organizationId),
      getNotificationPreference(session.id, membership.organizationId),
    ]);
    return (
      <NotificationsScreen
        remindersEnabled={can({ plan }, "AUTOMATIC_REMINDERS")}
        emailEnabled={pref.emailEnabled}
        inAppEnabled={pref.inAppEnabled}
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          readAt: item.readAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    );
  } catch {
    logger.warn("notifications_unavailable");
    return (
      <NotificationsScreen remindersEnabled={false} emailEnabled={true} inAppEnabled={true} items={[]} />
    );
  }
}
