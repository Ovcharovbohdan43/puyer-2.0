import { readFileSync } from "node:fs";
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

function readLinuxEnviron(): Record<string, string> {
  try {
    const raw = readFileSync("/proc/self/environ", "utf8");
    const out: Record<string, string> = {};
    for (const pair of raw.split("\0")) {
      const eq = pair.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      out[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
    return out;
  } catch {
    return {};
  }
}

export function runtimeEnv(): Record<string, string> {
  const merged: Record<string, string> = { ...readLinuxEnviron() };
  for (const [key, value] of Object.entries(nodeProcess.env)) {
    if (typeof value === "string" && value.trim() !== "") {
      merged[key] = value;
    }
  }
  return merged;
}

export function envString(name: string): string {
  return unwrapEnvValue(runtimeEnv()[name] ?? "");
}

export function linuxEnvironSize(): number {
  return Object.keys(readLinuxEnviron()).length;
}

export function listResendEnvNames(): string[] {
  return Object.keys(runtimeEnv())
    .filter((key) => /resend/i.test(key))
    .sort();
}

const RESEND_KEY_IN_TEXT = /re_[A-Za-z0-9_-]{8,}/;

function extractResendApiKey(raw: string): string {
  const value = unwrapEnvValue(raw).replace(/^Bearer\s+/i, "");
  const match = value.match(RESEND_KEY_IN_TEXT);
  return match?.[0] ?? "";
}

export function resendKeyProbe(): {
  names: string[];
  keyPresent: boolean;
  namedChars: number;
  startsWithRe: boolean;
} {
  const env = runtimeEnv();
  const named = unwrapEnvValue(env.RESEND_API_KEY ?? env.RESEND_KEY ?? "");
  return {
    names: listResendEnvNames(),
    keyPresent: Boolean(findResendApiKey()),
    namedChars: named.length,
    startsWithRe: named.startsWith("re_") || named.includes("re_"),
  };
}

export function findResendApiKey(): string {
  const env = runtimeEnv();
  const named = extractResendApiKey(env.RESEND_API_KEY ?? env.RESEND_KEY ?? "");
  if (named) {
    return named;
  }
  for (const [key, raw] of Object.entries(env)) {
    if (/secret|webhook/i.test(key)) {
      continue;
    }
    const value = extractResendApiKey(raw);
    if (value) {
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
