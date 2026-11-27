import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  listInvoiceIndex,
  listPayments,
  resetDemoData,
  upsertInvoiceIndex,
} from "@/features/erp/demoStore";
import { recordInvoicePayment } from "@/features/erp/paymentService";
import {
  buildRevenueInsightSeries,
  computeDashboardMetrics,
  formatLakhTick,
  isEligibleSalesInvoice,
} from "@/features/erp/selectors";
import { parseFlexibleDate } from "@/features/erp/historicalInvoiceSeed";

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

describe("Revenue Insights aggregation", () => {
  const now = new Date("2026-11-27T12:00:00.000Z");

  beforeEach(() => {
    mockStorage();
    resetDemoData();
  });

  it("aggregates monthly sales and collections for the selected year", () => {
    const series = buildRevenueInsightSeries({
      year: 2026,
      granularity: "month",
      now,
    });
    expect(series.series).toHaveLength(12);
    const nonZeroSales = series.series.filter((row) => row.salesAmount > 0);
    expect(nonZeroSales.length).toBeGreaterThan(5);
    // December (index 11) is after November "now" — must stay empty.
    expect(series.series[11]?.salesAmount).toBe(0);
    expect(series.series[11]?.collectionsAmount).toBe(0);
  });

  it("aggregates quarterly views without division-by-zero", () => {
    const emptyYear = buildRevenueInsightSeries({
      year: 1999,
      granularity: "quarter",
      now,
    });
    expect(emptyYear.series).toHaveLength(4);
    expect(emptyYear.growthPercent).toBe(0);

    const year = buildRevenueInsightSeries({
      year: 2026,
      granularity: "quarter",
      now,
    });
    expect(year.series.some((row) => row.salesAmount > 0)).toBe(true);
  });

  it("filters by year and keeps last-year data independent", () => {
    const current = buildRevenueInsightSeries({
      year: 2026,
      granularity: "month",
      now,
    });
    const previous = buildRevenueInsightSeries({
      year: 2025,
      granularity: "month",
      now,
    });
    expect(previous.periodSales).toBeGreaterThan(0);
    expect(current.periodSales).not.toBe(previous.periodSales);
  });

  it("excludes draft and cancelled invoices from sales", () => {
    const before = computeDashboardMetrics({ year: 2026, now });
    upsertInvoiceIndex({
      id: "draft-rev",
      number: "INV-DRAFT-REV",
      customer: "Fieldwork Labs",
      invoiceDate: "10 Jan 2026",
      dueDate: "10 Feb 2026",
      total: 500000,
      balance: 500000,
      status: "Draft",
    });
    upsertInvoiceIndex({
      id: "void-rev",
      number: "INV-VOID-REV",
      customer: "Fieldwork Labs",
      invoiceDate: "11 Jan 2026",
      dueDate: "11 Feb 2026",
      total: 400000,
      balance: 0,
      status: "Void",
    });
    const after = computeDashboardMetrics({ year: 2026, now });
    expect(after.totalSales).toBe(before.totalSales);
    expect(after.periodSales).toBe(before.periodSales);
    expect(isEligibleSalesInvoice("Draft")).toBe(false);
    expect(isEligibleSalesInvoice("Cancelled")).toBe(false);
  });

  it("attributes cross-year payments to the payment year, not invoice year", () => {
    upsertInvoiceIndex({
      id: "cross-inv",
      number: "INV-CROSS-1",
      customer: "UrbanMart",
      invoiceDate: "20 Dec 2025",
      dueDate: "20 Jan 2026",
      total: 20000,
      balance: 20000,
      status: "Pending",
    });
    recordInvoicePayment({
      invoiceId: "cross-inv",
      invoiceNumber: "INV-CROSS-1",
      customerName: "UrbanMart",
      amount: 20000,
      method: "UPI",
      reference: "TXN-CROSS",
      idempotencyKey: "pay:cross-inv:full",
      paidAt: "2026-01-15",
    });
    const sales2025 = buildRevenueInsightSeries({
      year: 2025,
      granularity: "month",
      now,
    });
    const collections2026 = buildRevenueInsightSeries({
      year: 2026,
      granularity: "month",
      now,
    });
    expect(sales2025.series[11]?.salesAmount).toBeGreaterThanOrEqual(20000);
    expect(collections2026.series[0]?.collectionsAmount).toBeGreaterThanOrEqual(
      20000,
    );
  });

  it("keeps all-time outstanding independent of period collections", () => {
    const metrics = computeDashboardMetrics({ year: 2026, now });
    const outstanding = listInvoiceIndex()
      .filter((row) => isEligibleSalesInvoice(row.status))
      .reduce((sum, row) => sum + row.balance, 0);
    expect(metrics.outstanding).toBe(outstanding);
    expect(metrics.periodCollections).not.toBe(metrics.outstanding);
  });

  it("formats lakh axis ticks and rejects future-dated seed rows", () => {
    expect(formatLakhTick(150)).toBe("₹1.5L");
    expect(formatLakhTick(20)).toBe("₹20k");
    for (const invoice of listInvoiceIndex()) {
      const date = parseFlexibleDate(invoice.invoiceDate);
      expect(date).toBeTruthy();
      expect(date!.getTime()).toBeLessThanOrEqual(now.getTime());
    }
    for (const payment of listPayments()) {
      const paidAt = parseFlexibleDate(payment.paidAt);
      const invoice = listInvoiceIndex().find(
        (row) => row.id === payment.invoiceId,
      );
      if (!invoice || !paidAt) continue;
      const issued = parseFlexibleDate(invoice.invoiceDate);
      if (!issued) continue;
      expect(paidAt.getTime()).toBeGreaterThanOrEqual(issued.getTime());
      expect(paidAt.getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });
});
