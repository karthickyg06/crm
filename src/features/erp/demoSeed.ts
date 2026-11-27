import { customerSeed, type Customer, type Invoice } from "@/features/crm/data";
import {
  buildHistoricalPayments,
  buildInvoiceSeed,
} from "@/features/erp/historicalInvoiceSeed";
import type {
  DemoAppState,
  PaymentRecord,
  Product,
  PurchaseOrder,
  Quotation,
  StockMovement,
  Vendor,
} from "@/features/erp/types";

/** v3: historical AR fixtures on fresh init / Reset only; migration preserves existing data. */
export const DEMO_STORE_VERSION = 3;

export const productSeed: Product[] = [
  {
    id: "p1",
    name: "Brand strategy retainer",
    sku: "SRV-BRAND-01",
    hsnSac: "998314",
    category: "Consulting",
    sellingPrice: 80000,
    purchasePrice: 0,
    gstRate: 18,
    unit: "month",
    stockQty: 999,
    lowStockAt: 0,
    kind: "service",
  },
  {
    id: "p2",
    name: "Website redesign milestone",
    sku: "SRV-WEB-01",
    hsnSac: "998314",
    category: "Digital",
    sellingPrice: 45000,
    purchasePrice: 0,
    gstRate: 18,
    unit: "project",
    stockQty: 999,
    lowStockAt: 0,
    kind: "service",
  },
  {
    id: "p3",
    name: "Product photography pack",
    sku: "SRV-PHOTO-01",
    hsnSac: "998371",
    category: "Creative",
    sellingPrice: 18000,
    purchasePrice: 0,
    gstRate: 18,
    unit: "pack",
    stockQty: 999,
    lowStockAt: 0,
    kind: "service",
  },
  {
    id: "p4",
    name: "Social ads management",
    sku: "SRV-ADS-01",
    hsnSac: "998365",
    category: "Marketing",
    sellingPrice: 35000,
    purchasePrice: 0,
    gstRate: 18,
    unit: "month",
    stockQty: 999,
    lowStockAt: 0,
    kind: "service",
  },
  {
    id: "p5",
    name: "Printed lookbook (A4)",
    sku: "PRD-BOOK-01",
    hsnSac: "491110",
    category: "Print",
    sellingPrice: 420,
    purchasePrice: 180,
    gstRate: 12,
    unit: "pcs",
    stockQty: 240,
    lowStockAt: 50,
    kind: "product",
  },
  {
    id: "p6",
    name: "Branded tote bag",
    sku: "PRD-TOTE-01",
    hsnSac: "420222",
    category: "Merchandise",
    sellingPrice: 280,
    purchasePrice: 95,
    gstRate: 12,
    unit: "pcs",
    stockQty: 180,
    lowStockAt: 40,
    kind: "product",
  },
  {
    id: "p7",
    name: "Packaging sample kit",
    sku: "PRD-PACK-01",
    hsnSac: "481910",
    category: "Packaging",
    sellingPrice: 950,
    purchasePrice: 420,
    gstRate: 18,
    unit: "kit",
    stockQty: 65,
    lowStockAt: 20,
    kind: "product",
  },
  {
    id: "p8",
    name: "Clinic wayfinding set",
    sku: "PRD-SIGN-01",
    hsnSac: "940560",
    category: "Signage",
    sellingPrice: 12500,
    purchasePrice: 6200,
    gstRate: 18,
    unit: "set",
    stockQty: 28,
    lowStockAt: 8,
    kind: "product",
  },
];

export const vendorSeed: Vendor[] = [
  {
    id: "v1",
    name: "Anita Deshmukh",
    company: "PaperCraft Supplies",
    phone: "+91 98230 11022",
    email: "orders@papercraft.in",
    gstin: "27AABCP1100A1Z1",
    address: "Bhiwandi, Maharashtra",
    status: "Active",
  },
  {
    id: "v2",
    name: "Farhan Qureshi",
    company: "PrintHouse West",
    phone: "+91 98920 33445",
    email: "sales@printhouse.west",
    gstin: "27AABCP2200B1Z2",
    address: "Andheri East, Mumbai",
    status: "Active",
  },
  {
    id: "v3",
    name: "Leena Joseph",
    company: "Signage Hub",
    phone: "+91 98450 66778",
    email: "hello@signagehub.in",
    gstin: "29AABCS3300C1Z3",
    address: "Peenya, Bengaluru",
    status: "Active",
  },
];

const customerByCompany = Object.fromEntries(
  customerSeed.map((c) => [c.company, c]),
);

function invoiceCustomerId(invoice: Invoice): string {
  return customerByCompany[invoice.customer]?.id ?? "c1";
}

export function buildDemoInvoiceIndex(
  now = new Date(),
): DemoAppState["invoiceIndex"] {
  return buildInvoiceSeed(now).map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    customerId: invoiceCustomerId(invoice),
    customer: invoice.customer,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    total: invoice.total,
    balance: invoice.balance,
    status: invoice.status,
  }));
}

export function buildDemoPayments(now = new Date()): PaymentRecord[] {
  return buildHistoricalPayments(buildInvoiceSeed(now), now);
}

/**
 * Safe migration: never reseed invoices/payments/products/inventory automatically.
 * Updated historical fixtures apply only on fresh initialization or resetDemoData().
 * Idempotent for already-v3 state.
 */
export function migrateDemoState(
  state: DemoAppState | null,
  now = new Date(),
): { state: DemoAppState; didWrite: boolean } {
  if (!state) {
    return { state: createInitialDemoState(now), didWrite: true };
  }
  if (state.version === DEMO_STORE_VERSION) {
    return { state, didWrite: false };
  }
  // Preserve all existing business data; bump version only.
  return {
    state: {
      ...state,
      version: DEMO_STORE_VERSION,
    },
    didWrite: true,
  };
}

export function buildDemoQuotations(): Quotation[] {
  return [
    {
      id: "q1",
      number: "QT-2026-0012",
      customerId: "c3",
      customerName: "Ananya Rao",
      company: "Monsoon Goods",
      quoteDate: "2026-12-10",
      validUntil: "2026-12-31",
      status: "Accepted",
      lines: [
        {
          id: "ql1",
          productId: "p4",
          name: "Social ads management",
          sku: "SRV-ADS-01",
          hsnSac: "998365",
          quantity: 2,
          unit: "month",
          unitPrice: 35000,
          discountPercent: 0,
          taxRatePercent: 18,
        },
        {
          id: "ql2",
          productId: "p5",
          name: "Printed lookbook (A4)",
          sku: "PRD-BOOK-01",
          hsnSac: "491110",
          quantity: 100,
          unit: "pcs",
          unitPrice: 420,
          discountPercent: 5,
          taxRatePercent: 12,
        },
      ],
      subtotal: 109900,
      taxTotal: 17628,
      grandTotal: 127528,
      notes: "Q1 campaign package",
      createdAt: "2026-12-10T09:00:00.000Z",
      updatedAt: "2026-12-18T09:00:00.000Z",
    },
    {
      id: "q2",
      number: "QT-2026-0013",
      customerId: "c4",
      customerName: "Kabir Desai",
      company: "Orbit Health",
      quoteDate: "2026-12-15",
      validUntil: "2027-01-15",
      status: "Sent",
      lines: [
        {
          id: "ql3",
          productId: "p3",
          name: "Product photography pack",
          sku: "SRV-PHOTO-01",
          hsnSac: "998371",
          quantity: 3,
          unit: "pack",
          unitPrice: 18000,
          discountPercent: 0,
          taxRatePercent: 18,
        },
        {
          id: "ql4",
          productId: "p8",
          name: "Clinic wayfinding set",
          sku: "PRD-SIGN-01",
          hsnSac: "940560",
          quantity: 2,
          unit: "set",
          unitPrice: 12500,
          discountPercent: 0,
          taxRatePercent: 18,
        },
      ],
      subtotal: 79000,
      taxTotal: 14220,
      grandTotal: 93220,
      notes: "Clinic rollout photography + signage",
      createdAt: "2026-12-15T11:00:00.000Z",
      updatedAt: "2026-12-15T11:00:00.000Z",
    },
    {
      id: "q3",
      number: "QT-2026-0014",
      customerId: "c1",
      customerName: "Meera Shah",
      company: "Fieldwork Labs",
      quoteDate: "2026-12-20",
      validUntil: "2027-01-20",
      status: "Draft",
      lines: [
        {
          id: "ql5",
          productId: "p1",
          name: "Brand strategy retainer",
          sku: "SRV-BRAND-01",
          hsnSac: "998314",
          quantity: 1,
          unit: "month",
          unitPrice: 80000,
          discountPercent: 0,
          taxRatePercent: 18,
        },
      ],
      subtotal: 80000,
      taxTotal: 14400,
      grandTotal: 94400,
      createdAt: "2026-12-20T08:00:00.000Z",
      updatedAt: "2026-12-20T08:00:00.000Z",
    },
  ];
}

export function buildDemoPurchaseOrders(): PurchaseOrder[] {
  return [
    {
      id: "po1",
      number: "PO-2026-0008",
      vendorId: "v1",
      vendorName: "PaperCraft Supplies",
      orderDate: "2026-12-05",
      status: "Received",
      lines: [
        {
          id: "pol1",
          productId: "p5",
          name: "Printed lookbook (A4)",
          quantity: 100,
          receivedQty: 100,
          unitCost: 180,
        },
        {
          id: "pol2",
          productId: "p7",
          name: "Packaging sample kit",
          quantity: 40,
          receivedQty: 40,
          unitCost: 420,
        },
      ],
      total: 34800,
      createdAt: "2026-12-05T10:00:00.000Z",
    },
    {
      id: "po2",
      number: "PO-2026-0009",
      vendorId: "v2",
      vendorName: "PrintHouse West",
      orderDate: "2026-12-18",
      status: "Ordered",
      lines: [
        {
          id: "pol3",
          productId: "p6",
          name: "Branded tote bag",
          quantity: 120,
          receivedQty: 0,
          unitCost: 110,
        },
      ],
      total: 13200,
      createdAt: "2026-12-18T10:00:00.000Z",
    },
  ];
}

export function buildDemoStockMovements(): StockMovement[] {
  return [
    {
      id: "sm1",
      productId: "p5",
      productName: "Printed lookbook (A4)",
      delta: 100,
      reason: "purchase_receive",
      referenceId: "po1",
      idempotencyKey: "grn:po1:p5",
      createdAt: "2026-12-08T10:00:00.000Z",
    },
    {
      id: "sm2",
      productId: "p7",
      productName: "Packaging sample kit",
      delta: 40,
      reason: "purchase_receive",
      referenceId: "po1",
      idempotencyKey: "grn:po1:p7",
      createdAt: "2026-12-08T10:00:00.000Z",
    },
    {
      id: "sm3",
      productId: "p5",
      productName: "Printed lookbook (A4)",
      delta: -20,
      reason: "invoice_issue",
      referenceId: "i8",
      idempotencyKey: "inv:i8:p5",
      createdAt: "2026-12-18T12:00:00.000Z",
    },
  ];
}

export function createInitialDemoState(now = new Date()): DemoAppState {
  return {
    version: DEMO_STORE_VERSION,
    seededAt: now.toISOString(),
    products: productSeed.map((p) => ({ ...p })),
    vendors: vendorSeed.map((v) => ({ ...v })),
    quotations: buildDemoQuotations(),
    payments: buildDemoPayments(now),
    purchaseOrders: buildDemoPurchaseOrders(),
    stockMovements: buildDemoStockMovements(),
    invoiceIndex: buildDemoInvoiceIndex(now),
  };
}

export function listDemoCustomers(): Customer[] {
  return customerSeed.map((c) => ({ ...c }));
}
