export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/invoices",
  "/clients",
  "/payments",
  "/reports",
  "/settings",
  "/team",
  "/billing",
  "/notifications",
] as const;

export function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
