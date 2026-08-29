import { describe, expect, it } from "vitest";

import { displayFirstName, greetingPeriod, splitMoneyDisplay } from "@/lib/dashboard/greeting";
import {
  filterInvoices,
  findInvoice,
  LIST_INVOICES,
  nextStatusFilter,
} from "@/lib/dashboard/invoices";
import { isNavActive } from "@/lib/dashboard/nav";

describe("greetingPeriod", () => {
  it("splits the day into morning, afternoon, and evening", () => {
    expect(greetingPeriod(0)).toBe("morning");
    expect(greetingPeriod(11)).toBe("morning");
    expect(greetingPeriod(12)).toBe("afternoon");
    expect(greetingPeriod(16)).toBe("afternoon");
    expect(greetingPeriod(17)).toBe("evening");
    expect(greetingPeriod(23)).toBe("evening");
  });
});

describe("displayFirstName", () => {
  it("prefers the first word of the profile name", () => {
    expect(displayFirstName("Ada Lovelace", "ada@puyer.test", "Freelancer")).toBe("Ada");
  });

  it("falls back to the email local part, then the copy fallback", () => {
    expect(displayFirstName(null, "ada@puyer.test", "Freelancer")).toBe("ada");
    expect(displayFirstName("  ", "", "Freelancer")).toBe("Freelancer");
  });
});

describe("splitMoneyDisplay", () => {
  it("keeps the decimal with the major segment like the Figma KPI", () => {
    expect(splitMoneyDisplay("$45,231.00")).toEqual({ major: "$45,231.", cents: "00" });
  });
});

describe("filterInvoices", () => {
  it("filters by client or invoice number", () => {
    const rows = filterInvoices(LIST_INVOICES, "globex", "ALL");
    expect(rows.map((row) => row.id)).toEqual(["INV-2024-002"]);
  });

  it("filters by status", () => {
    const rows = filterInvoices(LIST_INVOICES, "", "OVERDUE");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("INV-2024-003");
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterInvoices(LIST_INVOICES, "zzz", "ALL")).toEqual([]);
  });
});

describe("findInvoice and status filter cycle", () => {
  it("finds a list invoice by id", () => {
    expect(findInvoice(LIST_INVOICES, "INV-2024-001")?.client).toBe("Acme Corp");
    expect(findInvoice(LIST_INVOICES, null)).toBeNull();
  });

  it("cycles All → Pending → Paid → Overdue → All", () => {
    expect(nextStatusFilter("ALL")).toBe("PENDING");
    expect(nextStatusFilter("PENDING")).toBe("PAID");
    expect(nextStatusFilter("PAID")).toBe("OVERDUE");
    expect(nextStatusFilter("OVERDUE")).toBe("ALL");
  });
});

describe("isNavActive", () => {
  it("treats Overview as exact and Invoices as a prefix", () => {
    expect(isNavActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavActive("/invoices", "/dashboard")).toBe(false);
    expect(isNavActive("/invoices", "/invoices")).toBe(true);
    expect(isNavActive("/invoices/new", "/invoices")).toBe(true);
    expect(isNavActive("/invoices/INV-2024-001/edit", "/invoices")).toBe(true);
    expect(isNavActive("/help", "/help")).toBe(true);
    expect(isNavActive("/help", "/team")).toBe(false);
  });
});
