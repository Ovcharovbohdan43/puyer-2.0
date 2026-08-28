"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { t } from "@/lib/i18n";

export type TeamMemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
};

export type TeamInviteRow = {
  id: string;
  email: string;
  expiresAt: string;
};

export type TeamWorkspaceRow = {
  organizationId: string;
  name: string;
  current: boolean;
};

type TeamScreenProps = {
  canManage: boolean;
  needsUpgrade: boolean;
  currentUserId: string;
  members: TeamMemberRow[];
  invites: TeamInviteRow[];
  workspaces: TeamWorkspaceRow[];
};

export function TeamScreen({
  canManage,
  needsUpgrade,
  currentUserId,
  members,
  invites,
  workspaces,
}: TeamScreenProps) {
  const copy = t("team");
  const dash = t("dashboard");
  const billing = t("billing");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(path: string, init: RequestInit) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(path, init);
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(body.error || copy.saveFailed);
        return;
      }
      router.refresh();
      setEmail("");
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-[32px] leading-10 font-semibold text-[#F8F9FF]">{dash.nav.team}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-5 text-[#BEC6E0]">{copy.intro}</p>
      </div>

      {workspaces.length > 1 ? (
        <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
          <h2 className="text-[16px] leading-6 font-semibold text-white">{copy.workspaces}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.organizationId}
                type="button"
                disabled={pending || workspace.current}
                className={`rounded-lg px-3 py-2 text-[12px] font-semibold tracking-[0.6px] ${
                  workspace.current
                    ? "bg-[#F8F9FF] text-[#0B1C30]"
                    : "border border-[#C6C6CD] text-[#F8F9FF]"
                }`}
                onClick={() =>
                  void run("/api/team/switch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ organizationId: workspace.organizationId }),
                  })
                }
              >
                {workspace.name}
              </button>
            ))}
          </div>
        </article>
      ) : null}

      {needsUpgrade ? (
        <article className="rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px]">
          <p className="text-[14px] leading-5 text-[#BEC6E0]">{billing.upgradeBusiness}</p>
          <Link
            href="/billing"
            className="mt-4 inline-flex rounded-lg bg-[#F8F9FF] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0B1C30]"
          >
            {billing.upgradeToBusiness}
          </Link>
        </article>
      ) : null}

      {canManage && !needsUpgrade ? (
        <form
          className="flex flex-col gap-3 rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E] p-[17px] sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void run("/api/team/invite", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-[#BEC6E0]">
            {copy.inviteLabel}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-[38px] rounded-lg border border-[#C6C6CD] bg-[#0B1320] px-3 text-[14px] text-[#F8F9FF] outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#F8F9FF] px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0B1C30] disabled:opacity-60"
          >
            {copy.invite}
          </button>
        </form>
      ) : null}

      {error ? <p className="text-[14px] text-[#ef4444]">{error}</p> : null}

      <article className="overflow-hidden rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E]">
        <h2 className="border-b border-[rgba(198,198,205,0.5)] px-4 py-4 text-[24px] leading-8 font-bold text-white">
          {copy.members}
        </h2>
        <table className="w-full text-left text-[12px] text-[#F8F9FF]">
          <thead className="text-[#BEC6E0]">
            <tr>
              <th className="px-4 py-3 font-semibold">{copy.colName}</th>
              <th className="px-4 py-3 font-semibold">{copy.colEmail}</th>
              <th className="px-4 py-3 font-semibold">{copy.colRole}</th>
              {canManage && !needsUpgrade ? <th className="px-4 py-3 font-semibold">{copy.colActions}</th> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-[rgba(198,198,205,0.3)]">
                <td className="px-4 py-3">{member.name}</td>
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3">{member.role === "OWNER" ? copy.roleOwner : copy.roleMember}</td>
                {canManage && !needsUpgrade ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {member.role === "MEMBER" ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-[#6FFBBE]"
                          onClick={() =>
                            void run(`/api/team/members/${member.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ role: "OWNER" }),
                            })
                          }
                        >
                          {copy.makeOwner}
                        </button>
                      ) : member.userId !== currentUserId ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-[#6FFBBE]"
                          onClick={() =>
                            void run(`/api/team/members/${member.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ role: "MEMBER" }),
                            })
                          }
                        >
                          {copy.makeMember}
                        </button>
                      ) : null}
                      {member.userId !== currentUserId ? (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-[#ef4444]"
                          onClick={() =>
                            void run(`/api/team/members/${member.id}`, {
                              method: "DELETE",
                            })
                          }
                        >
                          {copy.remove}
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {invites.length > 0 ? (
        <article className="overflow-hidden rounded-xl border border-[rgba(198,198,205,0.5)] bg-[#131B2E]">
          <h2 className="border-b border-[rgba(198,198,205,0.5)] px-4 py-4 text-[24px] leading-8 font-bold text-white">
            {copy.pending}
          </h2>
          <ul className="divide-y divide-[rgba(198,198,205,0.3)]">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between px-4 py-3 text-[12px] text-[#F8F9FF]">
                <span>
                  {invite.email}
                  <span className="ml-2 text-[#BEC6E0]">
                    {copy.expires.replace("{date}", invite.expiresAt.slice(0, 10))}
                  </span>
                </span>
                {canManage && !needsUpgrade ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="text-[#ef4444]"
                    onClick={() =>
                      void run(`/api/team/invites/${invite.id}/revoke`, {
                        method: "POST",
                      })
                    }
                  >
                    {copy.revoke}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </main>
  );
}
