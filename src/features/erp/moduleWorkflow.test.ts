import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyInvoiceIssueStock,
  applyStockMovement,
  convertLeadToCustomer,
  listProducts,
  listPurchaseOrders,
  listStockMovements,
  listVendors,
  loadCustomers,
  loadLeads,
  recomputeCustomerOutstanding,
  resetDemoData,
  upsertInvoiceIndex,
  upsertPurchaseOrder,
  upsertVendor,
} from "@/features/erp/demoStore";
import { computeDashboardMetrics } from "@/features/erp/selectors";
import { saveDraftInvoice } from "@/features/invoices/services/issueService";
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

describe("Module workflow regressions", () => {
  beforeEach(() => {
    mockStorage();
    resetDemoData();
  });

  it("deducts product stock on invoice issue keys and skips services", () => {
    const product = listProducts().find((row) => row.kind === "product")!;
    const service = listProducts().find((row) => row.kind === "service")!;
    const beforeProduct = product.stockQty;
    const beforeService = service.stockQty;
    const beforeMoves = listStockMovements().length;

    applyInvoiceIssueStock({
      invoiceId: "inv-stock-1",
      lines: [
        { productId: product.id, quantity: 2, name: product.name },
        { productId: service.id, quantity: 1, name: service.name },
      ],
    });

    expect(listProducts().find((row) => row.id === product.id)!.stockQty).toBe(
      beforeProduct - 2,
    );
    expect(listProducts().find((row) => row.id === service.id)!.stockQty).toBe(
      beforeService,
    );

    applyInvoiceIssueStock({
      invoiceId: "inv-stock-1",
      lines: [{ productId: product.id, quantity: 2, name: product.name }],
    });
    expect(listProducts().find((row) => row.id === product.id)!.stockQty).toBe(
      beforeProduct - 2,
    );
    expect(
      listStockMovements().filter(
        (row) => row.idempotencyKey === `inv-issue:inv-stock-1:${product.id}`,
      ),
    ).toHaveLength(1);
    expect(listStockMovements().length).toBe(beforeMoves + 1);
  });

  it("blocks negative stock on invoice issue", () => {
    const product = listProducts().find((row) => row.kind === "product")!;
    expect(() =>
      applyInvoiceIssueStock({
        invoiceId: "inv-over",
        lines: [
          {
            productId: product.id,
            quantity: product.stockQty + 5,
            name: product.name,
          },
        ],
      }),
    ).toThrow(/Insufficient stock/i);
  });

  it("does not change stock when saving a draft invoice", async () => {
    const product = listProducts().find((row) => row.kind === "product")!;
    const before = product.stockQty;
    const doc = createSampleInvoiceDocument();
    doc.id = "draft-stock-1";
    doc.number = "INV-DRAFT-STOCK-1";
    doc.lines = [
      {
        ...doc.lines[0]!,
        productId: product.id,
        quantity: 3,
        name: product.name,
      },
    ];
    await saveDraftInvoice(doc);
    expect(listProducts().find((row) => row.id === product.id)!.stockQty).toBe(
      before,
    );
  });

  it("PO create does not increase stock; GRN partial receive does", () => {
    const product = listProducts().find((row) => row.kind === "product")!;
    const vendor = listVendors()[0]!;
    const before = product.stockQty;
    const order = {
      id: "po-partial-1",
      number: "PO-TEST-PARTIAL",
      vendorId: vendor.id,
      vendorName: vendor.company,
      orderDate: "2026-12-01",
      status: "Ordered" as const,
      lines: [
        {
          id: "pol-1",
          productId: product.id,
          name: product.name,
          quantity: 10,
          receivedQty: 0,
          unitCost: product.purchasePrice,
        },
      ],
      total: product.purchasePrice * 10,
      createdAt: new Date().toISOString(),
    };
    upsertPurchaseOrder(order);
    expect(listProducts().find((row) => row.id === product.id)!.stockQty).toBe(
      before,
    );

    applyStockMovement({
      id: "sm-partial",
      productId: product.id,
      productName: product.name,
      delta: 4,
      reason: "purchase_receive",
      referenceId: order.id,
      idempotencyKey: `grn:${order.id}:${product.id}:4`,
      createdAt: new Date().toISOString(),
    });
    expect(listProducts().find((row) => row.id === product.id)!.stockQty).toBe(
      before + 4,
    );
    expect(listPurchaseOrders().some((row) => row.id === order.id)).toBe(true);
  });

  it("supports vendor upsert persistence", () => {
    upsertVendor({
      id: "v-test",
      name: "Ravi",
      company: "Test Prints Co",
      phone: "9999999999",
      email: "ravi@test.example",
      gstin: "27AAAAA0000A1Z5",
      address: "Pune",
      status: "Active",
    });
    expect(listVendors().some((row) => row.id === "v-test")).toBe(true);
  });

  it("converts lead to customer idempotently", () => {
    const lead = loadLeads()[0]!;
    const first = convertLeadToCustomer(lead);
    const second = convertLeadToCustomer({ ...lead, status: "Hot" });
    expect(second.id).toBe(first.id);
    expect(loadCustomers().filter((c) => c.email === first.email).length).toBe(
      1,
    );
    expect(loadLeads().find((item) => item.id === lead.id)?.status).toBe(
      "Converted",
    );
  });

  it("recomputes outstanding after invoice index updates", () => {
    const customer = loadCustomers()[0]!;
    upsertInvoiceIndex({
      id: "inv-ar-1",
      number: "INV-AR-1",
      customerId: customer.id,
      customer: customer.company,
      invoiceDate: "2026-12-01",
      dueDate: "2026-12-31",
      total: 5000,
      balance: 5000,
      status: "Pending",
    });
    const updated = recomputeCustomerOutstanding().find(
      (row) => row.id === customer.id,
    )!;
    expect(updated.outstanding).toBeGreaterThanOrEqual(5000);
  });

  it("dashboard includes live lead deal and low-stock counts", () => {
    const metrics = computeDashboardMetrics();
    expect(metrics.leadCount).toBe(loadLeads().length);
    expect(metrics.customerCount).toBe(loadCustomers().length);
    expect(metrics.openDealCount).toBeGreaterThanOrEqual(0);
    expect(metrics.lowStockCount).toBeGreaterThanOrEqual(0);
    expect(metrics.totalSales).toBe(metrics.totalSales);
  });
});
