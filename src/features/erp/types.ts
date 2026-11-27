export type Product = {
  id: string;
  name: string;
  sku: string;
  hsnSac: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  gstRate: number;
  unit: string;
  stockQty: number;
  lowStockAt: number;
  kind: "product" | "service";
};

export type Vendor = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  status: "Active" | "Inactive";
};

export type QuotationStatus =
  "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted";

export type QuotationLine = {
  id: string;
  productId?: string;
  name: string;
  sku?: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  taxRatePercent?: number;
};

export type Quotation = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  company: string;
  quoteDate: string;
  validUntil: string;
  status: QuotationStatus;
  lines: QuotationLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  method: string;
  reference: string;
  paidAt: string;
  idempotencyKey: string;
  createdAt: string;
};

export type PurchaseOrderStatus =
  "Draft" | "Ordered" | "Partially Received" | "Received" | "Cancelled";

export type PurchaseOrderLine = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  receivedQty: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  number: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  total: number;
  createdAt: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  delta: number;
  reason: "purchase_receive" | "invoice_issue" | "adjustment" | "opening";
  referenceId: string;
  idempotencyKey: string;
  createdAt: string;
};

export type DemoAppState = {
  version: number;
  seededAt: string;
  products: Product[];
  vendors: Vendor[];
  quotations: Quotation[];
  payments: PaymentRecord[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  /** Invoice list rows mirrored for dashboard/AR (snapshots remain source of truth for PDFs). */
  invoiceIndex: Array<{
    id: string;
    number: string;
    customerId: string;
    customer: string;
    invoiceDate: string;
    dueDate: string;
    total: number;
    balance: number;
    status: string;
  }>;
};
