import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  listInvoiceIndex,
  listPayments,
  listProducts,
  listPurchaseOrders,
  listQuotations,
  listStockMovements,
  listVendors,
  loadCustomers,
  resetDemoData,
} from "@/features/erp/demoStore";
import { computeDashboardMetrics } from "@/features/erp/selectors";

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

describe("Demo data integrity", () => {
  beforeEach(() => {
    mockStorage();
    resetDemoData();
  });

  it("seeds interconnected customers products quotes invoices payments inventory", () => {
    expect(loadCustomers().length).toBeGreaterThan(5);
    expect(listProducts().length).toBeGreaterThan(3);
    expect(listQuotations().some((q) => q.status === "Accepted")).toBe(true);
    expect(listInvoiceIndex().some((i) => i.balance > 0)).toBe(true);
    expect(listInvoiceIndex().some((i) => i.status === "Paid")).toBe(true);
    expect(listPayments().length).toBeGreaterThan(0);
    expect(listVendors().length).toBeGreaterThan(0);
    expect(listPurchaseOrders().length).toBeGreaterThan(0);
    expect(listStockMovements().length).toBeGreaterThan(0);
  });

  it("keeps dashboard metrics aligned with invoice and payment ledgers", () => {
    const metrics = computeDashboardMetrics();
    const issued = listInvoiceIndex().filter((row) => row.status !== "Draft");
    expect(metrics.invoiceCount).toBe(issued.length);
    expect(metrics.customerCount).toBe(loadCustomers().length);
    expect(metrics.totalSales).toBe(
      issued.reduce((sum, row) => sum + row.total, 0),
    );
    expect(metrics.paymentsReceived).toBe(
      listPayments().reduce((sum, row) => sum + row.amount, 0),
    );
    expect(metrics.outstanding).toBe(
      issued.reduce((sum, row) => sum + row.balance, 0),
    );
  });

  it("links invoice customers to seeded customer companies", () => {
    const companies = new Set(loadCustomers().map((c) => c.company));
    for (const invoice of listInvoiceIndex()) {
      expect(companies.has(invoice.customer)).toBe(true);
    }
  });

  it("resetDemoData restores a clean isolated demo dataset", () => {
    const first = listInvoiceIndex().length;
    listInvoiceIndex().forEach(() => undefined);
    resetDemoData();
    expect(listInvoiceIndex().length).toBe(first);
    expect(loadCustomers().every((c) => c.email.includes("@"))).toBe(true);
  });
});
