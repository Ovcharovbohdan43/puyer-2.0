import { TeamScreen } from "@/components/dashboard/team-screen";
import { requireOrganization, requireSession } from "@/lib/authorization";
import { canOrgPermission } from "@/lib/authorization/permissions";
import { can } from "@/lib/entitlements";
import { planFromOrganization } from "@/lib/entitlements/load";
import { logger } from "@/lib/observability/logger";
import { listTeam, listUserWorkspaces } from "@/lib/team/service";

export default async function TeamPage() {
  const session = await requireSession();
  try {
    const membership = await requireOrganization(session);
    const plan = planFromOrganization(membership.organization);
    const [{ members, invites }, workspaces] = await Promise.all([
      listTeam(membership.organizationId),
      listUserWorkspaces(session.id),
    ]);
    const sorted = [...members].sort((a, b) => {
      if (a.role === b.role) {
        return a.user.email.localeCompare(b.user.email);
      }
      return a.role === "OWNER" ? -1 : 1;
    });
    return (
      <TeamScreen
        canManage={canOrgPermission(membership.role, "MANAGE_MEMBERS")}
        needsUpgrade={!can({ plan }, "TEAM_MEMBERS")}
        currentUserId={session.id}
        members={sorted.map((member) => ({
          id: member.id,
          userId: member.userId,
          name: member.user.name?.trim() || member.user.email,
          email: member.user.email,
          role: member.role,
        }))}
        invites={invites.map((invite) => ({
          id: invite.id,
          email: invite.email,
          expiresAt: invite.expiresAt.toISOString(),
        }))}
        workspaces={workspaces.map((item) => ({
          organizationId: item.organizationId,
          name: item.organization.name,
          current: item.organizationId === membership.organizationId,
        }))}
      />
    );
  } catch (error) {
    logger.warn("team_unavailable", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return (
      <TeamScreen
        canManage={false}
        needsUpgrade
        currentUserId={session.id}
        members={[]}
        invites={[]}
        workspaces={[]}
      />
    );
  }
}
