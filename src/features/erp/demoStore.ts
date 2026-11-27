import {
  customerSeed,
  type Customer,
  type Invoice,
  type Lead,
  leadSeed,
  type Deal,
  dealSeed,
} from "@/features/crm/data";
import {
  createInitialDemoState,
  DEMO_STORE_VERSION,
  listDemoCustomers,
  migrateDemoState,
} from "@/features/erp/demoSeed";
import type {
  DemoAppState,
  PaymentRecord,
  Product,
  PurchaseOrder,
  Quotation,
  StockMovement,
  Vendor,
} from "@/features/erp/types";

const STATE_KEY = "yaglob.demo.appState.v1";
const CUSTOMERS_KEY = "yaglob.demo.customers.v1";
const LEADS_KEY = "yaglob.demo.leads.v1";
const DEALS_KEY = "yaglob.demo.deals.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  listeners.forEach((listener) => listener());
}

export function subscribeDemoStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadDemoState(): DemoAppState {
  const stored = readJson<DemoAppState | null>(STATE_KEY, null);
  const { state, didWrite } = migrateDemoState(stored);
  if (didWrite) {
    writeJson(STATE_KEY, state);
  }
  return state;
}

export function saveDemoState(state: DemoAppState) {
  writeJson(STATE_KEY, state);
  return state;
}

export function updateDemoState(
  mutator: (current: DemoAppState) => DemoAppState,
) {
  const next = mutator(loadDemoState());
  return saveDemoState(next);
}

export function resetDemoData() {
  if (canUseStorage()) {
    window.localStorage.removeItem(STATE_KEY);
    window.localStorage.removeItem(CUSTOMERS_KEY);
    window.localStorage.removeItem(LEADS_KEY);
    window.localStorage.removeItem(DEALS_KEY);
  }
  const initial = createInitialDemoState();
  writeJson(STATE_KEY, initial);
  writeJson(CUSTOMERS_KEY, listDemoCustomers());
  writeJson(
    LEADS_KEY,
    leadSeed.map((l) => ({ ...l })),
  );
  writeJson(
    DEALS_KEY,
    dealSeed.map((d) => ({ ...d })),
  );
  return initial;
}

export function loadCustomers(): Customer[] {
  const stored = readJson<Customer[] | null>(CUSTOMERS_KEY, null);
  if (!stored) {
    const seed = listDemoCustomers();
    writeJson(CUSTOMERS_KEY, seed);
    return seed;
  }
  return stored.map((customer) => ({
    ...customer,
    whatsappNumber: customer.whatsappNumber || customer.phone,
  }));
}

export function saveCustomers(customers: Customer[]) {
  writeJson(CUSTOMERS_KEY, customers);
  return customers;
}

export function upsertCustomer(customer: Customer) {
  const current = loadCustomers();
  const exists = current.some((item) => item.id === customer.id);
  const next = exists
    ? current.map((item) => (item.id === customer.id ? customer : item))
    : [customer, ...current];
  return saveCustomers(next);
}

export function getCustomerById(id: string) {
  return loadCustomers().find((customer) => customer.id === id) ?? null;
}

export function loadLeads(): Lead[] {
  const stored = readJson<Lead[] | null>(LEADS_KEY, null);
  if (!stored) {
    const seed = leadSeed.map((l) => ({ ...l }));
    writeJson(LEADS_KEY, seed);
    return seed;
  }
  return stored;
}

export function saveLeads(leads: Lead[]) {
  writeJson(LEADS_KEY, leads);
  return leads;
}

export function loadDeals(): Deal[] {
  const stored = readJson<Deal[] | null>(DEALS_KEY, null);
  if (!stored) {
    const seed = dealSeed.map((d) => ({ ...d }));
    writeJson(DEALS_KEY, seed);
    return seed;
  }
  return stored;
}

export function saveDeals(deals: Deal[]) {
  writeJson(DEALS_KEY, deals);
  return deals;
}

export function convertLeadToCustomer(lead: Lead): Customer {
  const customers = loadCustomers();
  const existing = customers.find(
    (customer) =>
      customer.email.toLowerCase() === lead.email.toLowerCase() ||
      (customer.company === lead.company && customer.name === lead.name),
  );
  if (existing) {
    saveLeads(
      loadLeads().map((item) =>
        item.id === lead.id ? { ...item, status: "Converted" } : item,
      ),
    );
    return existing;
  }
  const customer: Customer = {
    id: `c-${Date.now()}`,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    whatsappNumber: lead.phone,
    email: lead.email,
    business: lead.value,
    outstanding: 0,
    status: "Active",
    industry: "Services",
    deals: 0,
    owner: lead.owner,
    createdOn: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    billingAddress: "",
    shippingAddress: "",
    gstin: "",
    notes: lead.notes,
  };
  upsertCustomer(customer);
  saveLeads(
    loadLeads().map((item) =>
      item.id === lead.id ? { ...item, status: "Converted" } : item,
    ),
  );
  return customer;
}

export function listProducts() {
  return loadDemoState().products;
}

export function upsertProduct(product: Product) {
  return updateDemoState((state) => {
    const exists = state.products.some((item) => item.id === product.id);
    return {
      ...state,
      products: exists
        ? state.products.map((item) =>
            item.id === product.id ? product : item,
          )
        : [product, ...state.products],
    };
  }).products;
}

export function listVendors() {
  return loadDemoState().vendors;
}

export function upsertVendor(vendor: Vendor) {
  return updateDemoState((state) => {
    const exists = state.vendors.some((item) => item.id === vendor.id);
    return {
      ...state,
      vendors: exists
        ? state.vendors.map((item) => (item.id === vendor.id ? vendor : item))
        : [vendor, ...state.vendors],
    };
  }).vendors;
}

export function listQuotations() {
  const today = new Date().toISOString().slice(0, 10);
  const state = loadDemoState();
  let changed = false;
  const quotations = state.quotations.map((quote) => {
    if (
      quote.validUntil < today &&
      quote.status !== "Converted" &&
      quote.status !== "Rejected" &&
      quote.status !== "Accepted" &&
      quote.status !== "Expired"
    ) {
      changed = true;
      return {
        ...quote,
        status: "Expired" as const,
        updatedAt: new Date().toISOString(),
      };
    }
    return quote;
  });
  if (changed) {
    saveDemoState({ ...state, quotations });
  }
  return quotations;
}

export function upsertQuotation(quotation: Quotation) {
  return updateDemoState((state) => {
    const exists = state.quotations.some((item) => item.id === quotation.id);
    return {
      ...state,
      quotations: exists
        ? state.quotations.map((item) =>
            item.id === quotation.id ? quotation : item,
          )
        : [quotation, ...state.quotations],
    };
  }).quotations;
}

export function getQuotation(id: string) {
  return listQuotations().find((item) => item.id === id) ?? null;
}

export function markQuotationConverted(quotationId: string, invoiceId: string) {
  const quotation = getQuotation(quotationId);
  if (!quotation) throw new Error("Quotation not found.");
  if (quotation.convertedInvoiceId === invoiceId) {
    return quotation;
  }
  if (quotation.status === "Converted" || quotation.convertedInvoiceId) {
    throw new Error("Quotation already converted.");
  }
  return upsertQuotation({
    ...quotation,
    status: "Converted",
    convertedInvoiceId: invoiceId,
    updatedAt: new Date().toISOString(),
  }).find((item) => item.id === quotationId)!;
}

export function listPayments() {
  return loadDemoState().payments;
}

export function addPayment(payment: PaymentRecord) {
  return updateDemoState((state) => {
    if (
      state.payments.some(
        (item) => item.idempotencyKey === payment.idempotencyKey,
      )
    ) {
      return state;
    }
    return { ...state, payments: [payment, ...state.payments] };
  }).payments;
}

export function listInvoiceIndex(): Invoice[] {
  return loadDemoState().invoiceIndex.map((row) => ({
    id: row.id,
    number: row.number,
    customer: row.customer,
    invoiceDate: row.invoiceDate,
    dueDate: row.dueDate,
    total: row.total,
    balance: row.balance,
    status: row.status,
  }));
}

export function upsertInvoiceIndex(invoice: Invoice & { customerId?: string }) {
  return updateDemoState((state) => {
    const customerId =
      invoice.customerId ??
      state.invoiceIndex.find((row) => row.id === invoice.id)?.customerId ??
      loadCustomers().find((c) => c.company === invoice.customer)?.id ??
      "";
    const row = {
      id: invoice.id,
      number: invoice.number,
      customerId,
      customer: invoice.customer,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      total: invoice.total,
      balance: invoice.balance,
      status: invoice.status,
    };
    const exists = state.invoiceIndex.some(
      (item) => item.id === row.id || item.number === row.number,
    );
    return {
      ...state,
      invoiceIndex: exists
        ? state.invoiceIndex.map((item) =>
            item.id === row.id || item.number === row.number ? row : item,
          )
        : [row, ...state.invoiceIndex],
    };
  }).invoiceIndex;
}

export function recomputeCustomerOutstanding() {
  const state = loadDemoState();
  const customers = loadCustomers().map((customer) => {
    const outstanding = state.invoiceIndex
      .filter(
        (invoice) =>
          invoice.customerId === customer.id ||
          invoice.customer === customer.company,
      )
      .filter(
        (invoice) => invoice.status !== "Draft" && invoice.status !== "Paid",
      )
      .reduce((sum, invoice) => sum + invoice.balance, 0);
    const business = state.invoiceIndex
      .filter(
        (invoice) =>
          invoice.customerId === customer.id ||
          invoice.customer === customer.company,
      )
      .filter((invoice) => invoice.status !== "Draft")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    return {
      ...customer,
      outstanding,
      business: business || customer.business,
    };
  });
  saveCustomers(customers);
  return customers;
}

export function listPurchaseOrders() {
  return loadDemoState().purchaseOrders;
}

export function upsertPurchaseOrder(order: PurchaseOrder) {
  return updateDemoState((state) => {
    const exists = state.purchaseOrders.some((item) => item.id === order.id);
    return {
      ...state,
      purchaseOrders: exists
        ? state.purchaseOrders.map((item) =>
            item.id === order.id ? order : item,
          )
        : [order, ...state.purchaseOrders],
    };
  }).purchaseOrders;
}

export function listStockMovements() {
  return loadDemoState().stockMovements;
}

export function applyStockMovement(movement: StockMovement) {
  return updateDemoState((state) => {
    if (
      state.stockMovements.some(
        (item) => item.idempotencyKey === movement.idempotencyKey,
      )
    ) {
      return state;
    }
    const product = state.products.find(
      (item) => item.id === movement.productId,
    );
    if (product) {
      const nextQty = product.stockQty + movement.delta;
      if (nextQty < 0) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available ${product.stockQty}.`,
        );
      }
    }
    return {
      ...state,
      stockMovements: [movement, ...state.stockMovements],
      products: state.products.map((item) =>
        item.id === movement.productId
          ? {
              ...item,
              stockQty: item.stockQty + movement.delta,
            }
          : item,
      ),
    };
  });
}

/** Deduct stock for tracked goods on invoice issue. Services are skipped. Idempotent. */
export function applyInvoiceIssueStock(input: {
  invoiceId: string;
  lines: Array<{ productId?: string; quantity: number; name: string }>;
}) {
  const products = listProducts();
  const byProduct = new Map<string, number>();
  for (const line of input.lines) {
    if (!line.productId) continue;
    const product = products.find((item) => item.id === line.productId);
    if (!product || product.kind !== "product") continue;
    byProduct.set(
      line.productId,
      (byProduct.get(line.productId) ?? 0) + (Number(line.quantity) || 0),
    );
  }

  for (const [productId, quantity] of byProduct) {
    if (!(quantity > 0)) continue;
    const product = products.find((item) => item.id === productId)!;
    const key = `inv-issue:${input.invoiceId}:${productId}`;
    const existing = listStockMovements().find(
      (item) => item.idempotencyKey === key,
    );
    if (existing) continue;
    if (product.stockQty < quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Need ${quantity}, available ${product.stockQty}.`,
      );
    }
    applyStockMovement({
      id: `sm-issue-${input.invoiceId}-${productId}`,
      productId,
      productName: product.name,
      delta: -quantity,
      reason: "invoice_issue",
      referenceId: input.invoiceId,
      idempotencyKey: key,
      createdAt: new Date().toISOString(),
    });
  }
}

/** Persist product edits and write adjustment/opening movement when stock changes. */
export function saveProductWithStockLedger(
  product: Product,
  previousStockQty?: number,
) {
  const prior =
    previousStockQty ??
    listProducts().find((item) => item.id === product.id)?.stockQty;
  upsertProduct(product);
  if (
    product.kind === "product" &&
    typeof prior === "number" &&
    prior !== product.stockQty
  ) {
    const delta = product.stockQty - prior;
    applyStockMovement({
      id: `sm-adj-${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      delta,
      reason: prior === 0 && product.stockQty > 0 ? "opening" : "adjustment",
      referenceId: product.id,
      idempotencyKey: `adj:${product.id}:${prior}->${product.stockQty}:${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }
  return listProducts();
}

/** Ensure demo customers include any companies referenced by seed invoices. */
export function ensureDemoBootstrapped() {
  loadDemoState();
  loadCustomers();
  loadLeads();
  loadDeals();
  // Silence unused import when tree-shaken oddly
  void customerSeed;
}
