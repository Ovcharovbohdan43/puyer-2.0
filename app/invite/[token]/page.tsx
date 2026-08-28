import { InviteAcceptScreen } from "@/components/invite/invite-accept-screen";
import { getSessionOrNull } from "@/lib/authorization";
import { lookupInvite } from "@/lib/team/service";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getSessionOrNull();
  let orgName: string | null = null;
  let inviteEmail: string | null = null;
  try {
    const invite = await lookupInvite(token);
    orgName = invite.organization.name;
    inviteEmail = invite.email;
  } catch {
    orgName = null;
  }
  return (
    <InviteAcceptScreen
      token={token}
      orgName={orgName}
      inviteEmail={inviteEmail}
      sessionEmail={session?.email ?? null}
    />
  );
}
