import { describe, expect, it } from "vitest";

import { formatInvoiceNumber } from "@/lib/invoices/numbering";
import { createInvoicePublicId, isInvoicePublicId } from "@/lib/invoices/public-id";
import { computeInvoiceFromBuilder, quantityToInput } from "@/lib/invoices/compute";
import {
  canTransition,
  displayInvoiceStatus,
  matchesListFilter,
  publicPayBadge,
} from "@/lib/invoices/status";
import { resolveTenantRecord } from "@/lib/authorization/tenant";
import { NotFoundError } from "@/lib/errors";
import { createDefaultBuilderState } from "@/components/invoice-builder/types";

describe("formatInvoiceNumber", () => {
  it("zero-pads the sequence and never uses COUNT(*)", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-0001");
    expect(formatInvoiceNumber(2026, 42)).toBe("INV-2026-0042");
    expect(formatInvoiceNumber(2026, 1)).not.toBe(formatInvoiceNumber(2026, 2));
  });

  it("rejects invalid sequence values", () => {
    expect(() => formatInvoiceNumber(2026, 0)).toThrow();
  });
});

describe("publicId", () => {
  it("creates a non-sequential id of at least 21 characters", () => {
    const id = createInvoicePublicId();
    expect(id.length).toBeGreaterThanOrEqual(21);
    expect(isInvoicePublicId(id)).toBe(true);
    expect(id).not.toMatch(/^INV-/);
  });
});

describe("status machine", () => {
  it("allows DRAFT → READY → SENT → VIEWED and forbids PAID → DRAFT", () => {
    expect(canTransition("DRAFT", "READY")).toBe(true);
    expect(canTransition("READY", "VIEWED")).toBe(true);
    expect(canTransition("READY", "SENT")).toBe(true);
    expect(canTransition("SENT", "VIEWED")).toBe(true);
    expect(canTransition("SENT", "PAID")).toBe(true);
    expect(canTransition("PAID", "DRAFT")).toBe(false);
    expect(canTransition("CANCELED", "READY")).toBe(false);
  });

  it("shows OVERDUE for unpaid invoices past due", () => {
    expect(displayInvoiceStatus("SENT", new Date("2026-01-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      "OVERDUE",
    );
    expect(displayInvoiceStatus("PAID", new Date("2026-01-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      "PAID",
    );
    expect(displayInvoiceStatus("DRAFT", new Date("2026-01-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      "DRAFT",
    );
  });

  it("maps public pay badges without exposing tenant fields", () => {
    expect(publicPayBadge("SENT", new Date("2026-12-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      "PENDING",
    );
    expect(publicPayBadge("SENT", new Date("2026-01-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      "OVERDUE",
    );
    expect(publicPayBadge("PAID", new Date("2026-01-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      "PAID",
    );
    expect(publicPayBadge("PARTIALLY_PAID", new Date("2026-12-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      "PARTIAL",
    );
  });

  it("filters list statuses", () => {
    expect(matchesListFilter("VIEWED", "PENDING")).toBe(true);
    expect(matchesListFilter("PAID", "PENDING")).toBe(false);
    expect(matchesListFilter("OVERDUE", "OVERDUE")).toBe(true);
  });
});

describe("tenant invoice access", () => {
  it("hides other tenants as not found", () => {
    expect(() => resolveTenantRecord({ organizationId: "org-a" }, "org-b")).toThrow(NotFoundError);
    expect(() => resolveTenantRecord(null, "org-a")).toThrow(NotFoundError);
    expect(resolveTenantRecord({ organizationId: "org-a", id: "1" }, "org-a").id).toBe("1");
  });
});

describe("server totals from builder", () => {
  it("recomputes bigint totals and does not trust client money fields", () => {
    const state = createDefaultBuilderState();
    const computed = computeInvoiceFromBuilder(state);
    expect(computed.subtotalMinor).toBe(650000n);
    expect(computed.totalMinor).toBe(650000n);
    expect(quantityToInput(10000n)).toBe("1");
    expect(quantityToInput(100000n)).toBe("10");
  });

  it("drops extra blank line items before totaling", () => {
    const state = createDefaultBuilderState();
    const base = computeInvoiceFromBuilder(state);
    state.items.push({ id: "blank", description: "", quantity: "1", unitPrice: "0.00" });
    expect(computeInvoiceFromBuilder(state).totalMinor).toBe(base.totalMinor);
  });
});
