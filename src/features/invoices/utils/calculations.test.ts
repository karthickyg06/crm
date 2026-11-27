import { describe, expect, it } from "vitest";

import {
  computeLine,
  computeLines,
  computeTotals,
  resolveTaxMode,
  validateInvoiceLines,
} from "@/features/invoices/utils/calculations";

describe("invoice calculations", () => {
  it("computes line totals with discount and tax", () => {
    const line = computeLine({
      id: "1",
      name: "Service",
      quantity: 2,
      unitPrice: 1000,
      discountPercent: 10,
      taxRatePercent: 18,
    });
    expect(line.lineSubtotal).toBe(2000);
    expect(line.discountAmount).toBe(200);
    expect(line.taxableAmount).toBe(1800);
    expect(line.taxAmount).toBe(324);
    expect(line.lineTotal).toBe(2124);
  });

  it("splits CGST/SGST for intra-state supply", () => {
    const lines = computeLines([
      { id: "1", name: "A", quantity: 1, unitPrice: 1000, taxRatePercent: 18 },
    ]);
    const totals = computeTotals(lines, "cgst_sgst", 0);
    expect(totals.taxTotal).toBe(180);
    expect(totals.cgst + totals.sgst).toBe(180);
    expect(totals.igst).toBe(0);
    expect(totals.grandTotal).toBe(1180);
  });

  it("uses IGST for inter-state supply", () => {
    expect(resolveTaxMode("Maharashtra", "Karnataka")).toBe("igst");
    const lines = computeLines([
      { id: "1", name: "A", quantity: 1, unitPrice: 1000, taxRatePercent: 18 },
    ]);
    const totals = computeTotals(lines, "igst", 200);
    expect(totals.igst).toBe(180);
    expect(totals.amountPaid).toBe(200);
    expect(totals.balanceDue).toBe(980);
  });

  it("validates required line fields", () => {
    expect(validateInvoiceLines([])).toContain("Add at least one line item.");
    expect(
      validateInvoiceLines([{ id: "1", name: "", quantity: 0, unitPrice: -1 }]),
    ).toEqual([
      "Line 1: name is required.",
      "Line 1: quantity must be greater than 0.",
      "Line 1: unit price cannot be negative.",
    ]);
  });
});
