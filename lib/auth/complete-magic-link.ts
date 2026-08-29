import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

const OTP_TYPES = new Set<string>([
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
  "email",
]);

export function hasMagicLinkParams(searchParams: URLSearchParams): boolean {
  return Boolean(searchParams.get("code") || searchParams.get("token_hash") || searchParams.get("token"));
}

export function tokenHashFromParams(searchParams: URLSearchParams): string | null {
  return searchParams.get("token_hash") || searchParams.get("token");
}

export function otpTypesToTry(type: string | null): EmailOtpType[] {
  const ordered: EmailOtpType[] = [];
  if (type && OTP_TYPES.has(type)) {
    ordered.push(type as EmailOtpType);
  }
  for (const fallback of ["magiclink", "email", "signup"] as const) {
    if (!ordered.includes(fallback)) {
      ordered.push(fallback);
    }
  }
  return ordered;
}

export async function completeMagicLinkSession(
  supabase: SupabaseClient,
  searchParams: URLSearchParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const tokenHash = tokenHashFromParams(searchParams);
  const type = searchParams.get("type");
  if (tokenHash) {
    let lastError = "verify_failed";
    for (const otpType of otpTypesToTry(type)) {
      const { error } = await supabase.auth.verifyOtp({
        type: otpType,
        token_hash: tokenHash,
      });
      if (!error) {
        return { ok: true };
      }
      lastError = error.code ?? error.message;
    }
    const code = searchParams.get("code");
    if (!code) {
      return { ok: false, error: lastError };
    }
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return { ok: true };
    }
    return { ok: false, error: error.code ?? error.message };
  }

  return { ok: false, error: "missing_code" };
}
