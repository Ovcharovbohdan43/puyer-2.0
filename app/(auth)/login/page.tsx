import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginPageView } from "@/components/auth/login-page";
import { getSessionOrNull } from "@/lib/authorization";
import type { AuthIntent } from "@/lib/auth/return-to";
import { findActiveBanForUser } from "@/lib/moderation/bans";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sign in — Puyer",
  description: t("meta").description,
};

function parseIntent(value: string | string[] | undefined): AuthIntent {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "subscribe") {
    return "subscribe";
  }
  return "login";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string | string[]; error?: string | string[] }>;
}) {
  const session = await getSessionOrNull();
  if (session) {
    if (await findActiveBanForUser(session.id)) {
      redirect("/banned");
    }
    redirect("/dashboard");
  }
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  return <LoginPageView intent={parseIntent(params.intent)} expired={error === "1"} />;
}
