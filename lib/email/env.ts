import nodeProcess from "node:process";

function unwrapEnvValue(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function envString(name: string): string {
  const value = nodeProcess.env[name];
  return unwrapEnvValue(typeof value === "string" ? value : "");
}

export function listResendEnvNames(): string[] {
  return Object.keys(nodeProcess.env)
    .filter((key) => /resend/i.test(key))
    .sort();
}

export function findResendApiKey(): string {
  const env = nodeProcess.env;
  for (const name of Object.keys(env)) {
    if (!/resend/i.test(name) || /secret|webhook/i.test(name)) {
      continue;
    }
    const value = unwrapEnvValue(typeof env[name] === "string" ? env[name] : "");
    if (value.startsWith("re_")) {
      return value;
    }
  }
  return "";
}

export function emailMailbox(from: string): string | null {
  const trimmed = from.trim();
  const angled = trimmed.match(/<([^<>\s]+@[^<>\s]+)>/);
  if (angled?.[1]) {
    return angled[1];
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}
