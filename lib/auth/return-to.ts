const ALLOWED_RETURN_TO = new Set(["/dashboard", "/invoices/new", "/pricing", "/settings"]);

export type AuthIntent = "login" | "download" | "share" | "subscribe";

export function returnToForIntent(intent: AuthIntent): string {
  if (intent === "download") {
    return "/?resume=download";
  }
  if (intent === "share") {
    return "/?resume=share";
  }
  if (intent === "subscribe") {
    return "/pricing";
  }
  return "/dashboard";
}

export function isInviteReturnTo(value: string): boolean {
  return /^\/invite\/[a-f0-9]{64}$/i.test(value);
}

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value) {
    return "/dashboard";
  }
  if (value.startsWith("/?resume=")) {
    const resume = value.slice("/?resume=".length);
    if (resume === "download" || resume === "share") {
      return value;
    }
  }
  if (ALLOWED_RETURN_TO.has(value) || isInviteReturnTo(value)) {
    return value;
  }
  return "/dashboard";
}
