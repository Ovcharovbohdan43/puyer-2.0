import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Webhook } from "standardwebhooks";
import { afterEach, describe, expect, it, vi } from "vitest";

import { authEmailMessage, authVerifyUrl } from "@/lib/email/auth-templates";
import { deliverEmail } from "@/lib/email/resend";
import { handleSendEmailHook, parseSendEmailHookSecret } from "@/lib/email/send-email-hook";

vi.mock("@/lib/email/resend", () => ({
  deliverEmail: vi.fn(async () => ({ skipped: false, providerMessageId: "re_test" })),
}));

function signedRequest(secret: string, payload: object) {
  const body = JSON.stringify(payload);
  const webhook = new Webhook(parseSendEmailHookSecret(secret));
  const id = "msg_auth_email_test";
  const timestamp = new Date();
  const signature = webhook.sign(id, timestamp, body);
  return new Request("http://localhost:3000/api/auth/send-email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signature,
    },
    body,
  });
}

describe("auth email templates", () => {
  it("builds a branded magic-link message with verify URL and code", () => {
    const message = authEmailMessage({
      to: "ada@puyer.org",
      action: "magiclink",
      token: "305805",
      tokenHash: "abc123hash",
      redirectTo: "http://localhost:3000/auth/callback",
      supabaseUrl: "https://example.supabase.co",
      idempotencyKey: "auth-email:test",
    });
    expect(message.subject).toBe("Sign in to Puyer");
    expect(message.html).toContain("<!DOCTYPE html");
    expect(message.html).toContain('charset=UTF-8');
    expect(message.html).toContain('width="600"');
    expect(message.html).toContain('bgcolor="#F1F5F9"');
    expect(message.html).toContain("Puyer");
    expect(message.html).toContain("puyer-logo.png");
    expect(message.html).toContain("#006C49");
    expect(message.html).toContain("305805");
    const verifyUrl = authVerifyUrl({
      supabaseUrl: "https://example.supabase.co",
      tokenHash: "abc123hash",
      action: "magiclink",
      redirectTo: "http://localhost:3000/auth/callback",
    });
    expect(message.text).toContain(verifyUrl);
    expect(message.html).toContain("abc123hash");
  });

  it("ships a full Resend HTML document for the Magic Link dashboard template", () => {
    const html = readFileSync(join(process.cwd(), "supabase/templates/magic_link.html"), "utf8");
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain('charset=UTF-8');
    expect(html).toContain('width="600"');
    expect(html).toContain('bgcolor="#006C49"');
    expect(html).toContain("{{ .ConfirmationURL }}");
    expect(html).toContain("{{ .Token }}");
    expect(html).not.toContain("{{{");
  });
});

describe("send email hook", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(deliverEmail).mockClear();
  });

  it("strips the v1 prefix from the dashboard secret", () => {
    expect(parseSendEmailHookSecret("v1,whsec_abc")).toBe("whsec_abc");
  });

  it("returns 503 when the hook secret is missing", async () => {
    vi.stubEnv("SEND_EMAIL_HOOK_SECRET", "");
    const response = await handleSendEmailHook(
      new Request("http://localhost:3000/api/auth/send-email", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(503);
  });

  it("sends a magic link after a valid Standard Webhooks signature", async () => {
    const secret = `v1,whsec_${Buffer.from("0123456789abcdef0123456789abcdef").toString("base64")}`;
    vi.stubEnv("SEND_EMAIL_HOOK_SECRET", secret);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const response = await handleSendEmailHook(
      signedRequest(secret, {
        user: { email: "ada@puyer.org" },
        email_data: {
          token: "305805",
          token_hash: "tokenhash",
          redirect_to: "http://localhost:3000/auth/callback",
          email_action_type: "magiclink",
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(vi.mocked(deliverEmail)).toHaveBeenCalledOnce();
    const sent = vi.mocked(deliverEmail).mock.calls[0]?.[0];
    expect(sent?.to).toBe("ada@puyer.org");
    expect(sent?.subject).toBe("Sign in to Puyer");
  });
});
