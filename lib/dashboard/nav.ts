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
  icon: string;
  iconActive?: string;
};

export const SIDEBAR_NAV: AppNavItem[] = [
  { id: "overview", href: "/dashboard", icon: "/app/kpi-revenue.svg" },
  { id: "clients", href: "/clients", icon: "/app/action-client.svg" },
  { id: "invoices", href: "/invoices", icon: "/landing/builder-doc.svg" },
  { id: "payments", href: "/payments", icon: "/app/kpi-paid.svg" },
  { id: "reports", href: "/reports", icon: "/app/chart.svg" },
];

export const SETTINGS_NAV: AppNavItem = {
  id: "settings",
  href: "/settings",
  icon: "/app/theme.svg",
};

export const FOOTER_NAV = [
  SETTINGS_NAV,
  { id: "team" as const, href: "/team", icon: "/app/action-client.svg" },
  { id: "notifications" as const, href: "/notifications", icon: "/app/insight.svg" },
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
