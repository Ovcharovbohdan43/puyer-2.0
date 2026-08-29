import nodeProcess from "node:process";

export function envString(name: string): string {
  const value = nodeProcess.env[name];
  return typeof value === "string" ? value.trim() : "";
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
