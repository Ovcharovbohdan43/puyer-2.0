export type AppNavId =
  | "overview"
  | "invoices"
  | "clients"
  | "payments"
  | "reports"
  | "settings";

export type AppNavItem = {
  id: AppNavId;
  href: string;
};

export const SIDEBAR_NAV: AppNavItem[] = [
  { id: "overview", href: "/dashboard" },
  { id: "clients", href: "/clients" },
  { id: "invoices", href: "/invoices" },
  { id: "payments", href: "/payments" },
  { id: "reports", href: "/reports" },
];

export const SETTINGS_NAV: AppNavItem = {
  id: "settings",
  href: "/settings",
};

export const FOOTER_NAV = [
  SETTINGS_NAV,
  { id: "team" as const, href: "/team" },
  { id: "notifications" as const, href: "/notifications" },
];

export const MOBILE_PRIMARY_NAV: AppNavItem[] = SIDEBAR_NAV.filter(
  (item) => item.id !== "reports",
);

export const MORE_LINKS = [
  { id: "reports" as const, href: "/reports" },
  { id: "settings" as const, href: "/settings" },
  { id: "team" as const, href: "/team" },
  { id: "billing" as const, href: "/billing" },
  { id: "notifications" as const, href: "/notifications" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function planCopyKey(plan: "FREE" | "PRO" | "BUSINESS"): "freePlan" | "proPlan" | "businessPlan" {
  if (plan === "PRO") {
    return "proPlan";
  }
  if (plan === "BUSINESS") {
    return "businessPlan";
  }
  return "freePlan";
}
