import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEMO_STORE_VERSION,
  createInitialDemoState,
  migrateDemoState,
} from "@/features/erp/demoSeed";
import {
  loadDemoState,
  resetDemoData,
  saveDemoState,
} from "@/features/erp/demoStore";
import type { DemoAppState } from "@/features/erp/types";

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
  return store;
}

describe("Demo store migration safety", () => {
  beforeEach(() => {
    mockStorage();
  });

  it("fresh initialization uses historical fixtures across multiple months", () => {
    const now = new Date("2026-11-27T12:00:00.000Z");
    const state = createInitialDemoState(now);
    expect(state.version).toBe(DEMO_STORE_VERSION);
    expect(state.invoiceIndex.length).toBeGreaterThan(14);
    const months = new Set(
      state.invoiceIndex.map((invoice) => {
        const parsed = Date.parse(invoice.invoiceDate);
        return Number.isNaN(parsed)
          ? invoice.invoiceDate
          : new Date(parsed).getMonth();
      }),
    );
    expect(months.size).toBeGreaterThan(6);
    const future = state.invoiceIndex.some((invoice) => {
      const time = Date.parse(invoice.invoiceDate);
      return !Number.isNaN(time) && time > now.getTime();
    });
    expect(future).toBe(false);
  });

  it("preserves user-created invoices and payments when migrating v2 → v3", () => {
    const now = new Date("2026-11-27T12:00:00.000Z");
    const v2: DemoAppState = {
      ...createInitialDemoState(now),
      version: 2,
      invoiceIndex: [
        {
          id: "user-inv-1",
          number: "INV-USER-1",
          customerId: "c1",
          customer: "Fieldwork Labs",
          invoiceDate: "15 Jun 2026",
          dueDate: "15 Jul 2026",
          total: 12000,
          balance: 2000,
          status: "Pending",
        },
      ],
      payments: [
        {
          id: "user-pay-1",
          invoiceId: "user-inv-1",
          invoiceNumber: "INV-USER-1",
          customerName: "Fieldwork Labs",
          amount: 10000,
          method: "UPI",
          reference: "TXN-USER",
          paidAt: "2026-06-20",
          idempotencyKey: "pay:user-inv-1:1",
          createdAt: "2026-06-20T10:00:00.000Z",
        },
        {
          id: "user-pay-seed-link",
          invoiceId: "i1",
          invoiceNumber: "INV-OLD-SEED",
          customerName: "StyleHub Retail",
          amount: 500,
          method: "Cash",
          reference: "TXN-SEED-LINK",
          paidAt: "2026-06-21",
          idempotencyKey: "pay:i1:user",
          createdAt: "2026-06-21T10:00:00.000Z",
        },
      ],
      products: [
        {
          id: "user-p1",
          name: "Custom product",
          sku: "USR-1",
          hsnSac: "1234",
          category: "Custom",
          sellingPrice: 100,
          purchasePrice: 50,
          gstRate: 18,
          unit: "pcs",
          stockQty: 7,
          lowStockAt: 1,
          kind: "product",
        },
      ],
      stockMovements: [
        {
          id: "user-sm-1",
          productId: "user-p1",
          productName: "Custom product",
          delta: 7,
          reason: "opening",
          referenceId: "user-p1",
          idempotencyKey: "open:user-p1",
          createdAt: "2026-06-01T10:00:00.000Z",
        },
      ],
    };

    const first = migrateDemoState(v2, now);
    expect(first.didWrite).toBe(true);
    expect(first.state.version).toBe(3);
    expect(first.state.invoiceIndex).toEqual(v2.invoiceIndex);
    expect(first.state.payments).toEqual(v2.payments);
    expect(first.state.products).toEqual(v2.products);
    expect(first.state.stockMovements).toEqual(v2.stockMovements);

    const second = migrateDemoState(first.state, now);
    expect(second.didWrite).toBe(false);
    expect(second.state).toBe(first.state);
  });

  it("preserves user modifications to seed invoice rows on migration", () => {
    const now = new Date("2026-11-27T12:00:00.000Z");
    const base = createInitialDemoState(now);
    const modified: DemoAppState = {
      ...base,
      version: 2,
      invoiceIndex: base.invoiceIndex.map((invoice, index) =>
        index === 0
          ? { ...invoice, total: 999999, balance: 1, status: "Pending" }
          : invoice,
      ),
    };
    const migrated = migrateDemoState(modified, now);
    expect(migrated.state.invoiceIndex[0]?.total).toBe(999999);
    expect(migrated.state.invoiceIndex[0]?.balance).toBe(1);
  });

  it("loadDemoState migration is idempotent and reset applies new fixtures", () => {
    const store = mockStorage();
    const now = new Date("2026-11-27T12:00:00.000Z");
    const v2 = { ...createInitialDemoState(now), version: 2 };
    v2.invoiceIndex = [
      {
        id: "keep-me",
        number: "INV-KEEP",
        customerId: "c1",
        customer: "UrbanMart",
        invoiceDate: "01 May 2026",
        dueDate: "31 May 2026",
        total: 5000,
        balance: 5000,
        status: "Pending",
      },
    ];
    store["yaglob.demo.appState.v1"] = JSON.stringify(v2);

    const loaded = loadDemoState();
    expect(loaded.version).toBe(3);
    expect(loaded.invoiceIndex.some((row) => row.id === "keep-me")).toBe(true);

    const again = loadDemoState();
    expect(again.invoiceIndex).toEqual(loaded.invoiceIndex);

    resetDemoData();
    const reset = loadDemoState();
    expect(reset.invoiceIndex.some((row) => row.id === "keep-me")).toBe(false);
    expect(reset.invoiceIndex.length).toBeGreaterThan(14);
  });

  it("does not rewrite stock quantities during version bump", () => {
    const now = new Date("2026-11-27T12:00:00.000Z");
    const state = createInitialDemoState(now);
    state.version = 2;
    state.products = state.products.map((product) =>
      product.id === "p5" ? { ...product, stockQty: 42 } : product,
    );
    saveDemoState(state);
    // Force stored version 2
    const raw = JSON.parse(
      window.localStorage.getItem("yaglob.demo.appState.v1")!,
    ) as DemoAppState;
    raw.version = 2;
    window.localStorage.setItem("yaglob.demo.appState.v1", JSON.stringify(raw));

    const loaded = loadDemoState();
    expect(
      loaded.products.find((product) => product.id === "p5")?.stockQty,
    ).toBe(42);
  });
});
