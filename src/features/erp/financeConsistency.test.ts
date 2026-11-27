import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyStockMovement,
  listInvoiceIndex,
  listPayments,
  listStockMovements,
  markQuotationConverted,
  resetDemoData,
  upsertInvoiceIndex,
  upsertQuotation,
} from "@/features/erp/demoStore";
import { recordInvoicePayment } from "@/features/erp/paymentService";
import {
  computeDashboardMetrics,
  computeInvoiceSummary,
} from "@/features/erp/selectors";
import {
  assertUniqueInvoiceNumber,
  saveInvoiceSnapshot,
  updateInvoiceTemplate,
} from "@/features/invoices/services/snapshotStore";
import { createSampleInvoiceDocument } from "@/features/invoices/utils/sampleDocument";

function mockStorage() {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", storage);
}

describe("Financial consistency and duplicate guards", () => {
  beforeEach(() => {
    mockStorage();
    resetDemoData();
  });

  it("excludes draft invoices from sales and dashboard totals", () => {
    upsertInvoiceIndex({
      id: "draft-1",
      number: "INV-DRAFT-1",
      customer: "Fieldwork Labs",
      invoiceDate: "2026-12-01",
      dueDate: "2026-12-31",
      total: 999999,
      balance: 999999,
      status: "Draft",
    });
    const summary = computeInvoiceSummary(listInvoiceIndex());
    const metrics = computeDashboardMetrics();
    expect(summary.totals.all).toBe(
      listInvoiceIndex().filter((row) => row.status !== "Draft").length,
    );
    expect(metrics.totalSales).toBe(
      listInvoiceIndex()
        .filter((row) => row.status !== "Draft")
        .reduce((sum, row) => sum + row.total, 0),
    );
    expect(metrics.totalSales).not.toBe(
      listInvoiceIndex().reduce((sum, row) => sum + row.total, 0),
    );
  });

  it("does not count payments as additional invoice revenue", () => {
    const before = computeDashboardMetrics();
    const unpaid = listInvoiceIndex().find((row) => row.balance > 0);
    expect(unpaid).toBeTruthy();
    recordInvoicePayment({
      invoiceId: unpaid!.id,
      invoiceNumber: unpaid!.number,
      customerName: unpaid!.customer,
      amount: Math.min(1000, unpaid!.balance),
      method: "UPI",
      reference: "TXN-REV-1",
      idempotencyKey: "pay:rev:1",
    });
    const after = computeDashboardMetrics();
    expect(after.totalSales).toBe(before.totalSales);
    expect(after.paymentsReceived).toBeGreaterThan(before.paymentsReceived);
  });

  it("applies partial and full payments and rejects overpayment", () => {
    const unpaid = listInvoiceIndex().find(
      (row) => row.balance >= 2000 && row.status !== "Paid",
    );
    expect(unpaid).toBeTruthy();
    const half = Math.round(unpaid!.balance / 2);
    recordInvoicePayment({
      invoiceId: unpaid!.id,
      invoiceNumber: unpaid!.number,
      customerName: unpaid!.customer,
      amount: half,
      method: "Bank transfer",
      reference: "TXN-PARTIAL",
      idempotencyKey: `pay:${unpaid!.id}:partial`,
    });
    const mid = listInvoiceIndex().find((row) => row.id === unpaid!.id)!;
    expect(mid.balance).toBe(unpaid!.balance - half);
    expect(mid.status).toBe("Pending");

    recordInvoicePayment({
      invoiceId: unpaid!.id,
      invoiceNumber: unpaid!.number,
      customerName: unpaid!.customer,
      amount: mid.balance,
      method: "Bank transfer",
      reference: "TXN-FULL",
      idempotencyKey: `pay:${unpaid!.id}:full`,
    });
    const paid = listInvoiceIndex().find((row) => row.id === unpaid!.id)!;
    expect(paid.balance).toBe(0);
    expect(paid.status).toBe("Paid");

    expect(() =>
      recordInvoicePayment({
        invoiceId: unpaid!.id,
        invoiceNumber: unpaid!.number,
        customerName: unpaid!.customer,
        amount: 1,
        method: "Cash",
        reference: "TXN-OVER",
        idempotencyKey: `pay:${unpaid!.id}:over`,
      }),
    ).toThrow(/exceeds outstanding/i);
  });

  it("keeps AR outstanding equal to sum of unpaid balances", () => {
    const metrics = computeDashboardMetrics();
    const outstanding = listInvoiceIndex()
      .filter((row) => row.status !== "Draft")
      .reduce((sum, row) => sum + row.balance, 0);
    expect(metrics.outstanding).toBe(outstanding);
  });

  it("prevents duplicate invoice numbers on snapshots", () => {
    const doc = createSampleInvoiceDocument();
    doc.id = "unique-a";
    doc.number = "INV-UNIQUE-1";
    saveInvoiceSnapshot(doc);
    expect(() => assertUniqueInvoiceNumber("INV-UNIQUE-1")).toThrow(
      /already exists/i,
    );
    expect(() =>
      assertUniqueInvoiceNumber("INV-UNIQUE-1", "unique-a"),
    ).not.toThrow();
  });

  it("prevents duplicate quotation conversion", () => {
    upsertQuotation({
      id: "q-dup",
      number: "QT-DUP-1",
      customerId: "c1",
      customerName: "Meera Shah",
      company: "Fieldwork Labs",
      quoteDate: "2026-12-01",
      validUntil: "2026-12-31",
      status: "Accepted",
      lines: [
        {
          id: "l1",
          name: "Service",
          quantity: 1,
          unitPrice: 1000,
          taxRatePercent: 18,
        },
      ],
      subtotal: 1000,
      taxTotal: 180,
      grandTotal: 1180,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    markQuotationConverted("q-dup", "inv-from-q");
    expect(() => markQuotationConverted("q-dup", "inv-from-q-2")).toThrow(
      /already converted/i,
    );
  });

  it("preserves financial totals when switching templates", () => {
    const doc = createSampleInvoiceDocument("classic-a4");
    doc.id = "tmpl-switch-1";
    doc.number = "INV-TMPL-1";
    const before = { ...doc.totals };
    saveInvoiceSnapshot(doc);
    const updated = updateInvoiceTemplate("tmpl-switch-1", "professional-a4");
    expect(updated.templateId).toBe("professional-a4");
    expect(updated.totals).toEqual(before);
    expect(updated.lines).toEqual(doc.lines);
  });

  it("prevents duplicate goods receiving stock movements", () => {
    const before = listStockMovements().length;
    applyStockMovement({
      id: "sm-test-1",
      productId: "p5",
      productName: "Printed lookbook (A4)",
      delta: 5,
      reason: "purchase_receive",
      referenceId: "po-test",
      idempotencyKey: "grn:po-test:p5",
      createdAt: new Date().toISOString(),
    });
    applyStockMovement({
      id: "sm-test-2",
      productId: "p5",
      productName: "Printed lookbook (A4)",
      delta: 5,
      reason: "purchase_receive",
      referenceId: "po-test",
      idempotencyKey: "grn:po-test:p5",
      createdAt: new Date().toISOString(),
    });
    const matches = listStockMovements().filter(
      (row) => row.idempotencyKey === "grn:po-test:p5",
    );
    expect(matches).toHaveLength(1);
    expect(listStockMovements().length).toBe(before + 1);
  });

  it("payment idempotency does not create duplicate ledger rows", () => {
    const unpaid = listInvoiceIndex().find((row) => row.balance > 0)!;
    const payload = {
      invoiceId: unpaid.id,
      invoiceNumber: unpaid.number,
      customerName: unpaid.customer,
      amount: Math.min(500, unpaid.balance),
      method: "UPI",
      reference: "TXN-IDEM",
      idempotencyKey: `pay:${unpaid.id}:idem`,
    };
    recordInvoicePayment(payload);
    recordInvoicePayment(payload);
    expect(
      listPayments().filter(
        (row) => row.idempotencyKey === payload.idempotencyKey,
      ),
    ).toHaveLength(1);
  });
});
