export type PaperFormat = "A4" | "A5" | "T80" | "T58";

export type InvoiceLifecycleStatus =
  "Draft" | "Issued" | "Paid" | "Pending" | "Overdue" | "Partially Paid";

export type TaxMode = "cgst_sgst" | "igst" | "none";

export type DeliveryChannel = "whatsapp" | "email";

export type DeliveryStatus =
  "Pending" | "Processing" | "Sent" | "Delivered" | "Failed" | "NotConfigured";

export type InvoiceCompany = {
  name: string;
  logoUrl?: string;
  address: string;
  gstin?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  brandColor: string;
  footerMessage?: string;
  terms?: string;
  signatureLabel?: string;
};

export type InvoiceCustomerInfo = {
  name: string;
  company?: string;
  billingAddress?: string;
  shippingAddress?: string;
  gstin?: string;
  placeOfSupply?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
};

export type InvoiceLineInput = {
  id: string;
  productId?: string;
  sku?: string;
  name: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  taxRatePercent?: number;
};

export type InvoiceLineComputed = InvoiceLineInput & {
  lineSubtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  lineTotal: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
};

export type InvoiceFieldVisibility = {
  logo: boolean;
  shippingAddress: boolean;
  customerGstin: boolean;
  hsnSac: boolean;
  bankDetails: boolean;
  paymentQr: boolean;
  terms: boolean;
  signature: boolean;
};

export type OrgInvoicePreferences = {
  orgId: string;
  defaultDigitalTemplateId: string;
  defaultPrintTemplateId: string;
  defaultPaper: PaperFormat;
  company: InvoiceCompany;
  numberingFormat: string;
  fieldVisibility: InvoiceFieldVisibility;
  autoOpenPrintAfterIssue: boolean;
  notifyWhatsAppOnIssue: boolean;
  notifyEmailOnIssue: boolean;
};

export type InvoiceDocumentModel = {
  id: string;
  number: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceLifecycleStatus;
  company: InvoiceCompany;
  customer: InvoiceCustomerInfo;
  lines: InvoiceLineComputed[];
  totals: InvoiceTotals;
  taxMode: TaxMode;
  paymentMethod?: string;
  paymentQrPayload?: string;
  paymentQrDataUrl?: string;
  notes?: string;
  templateId: string;
  templateVersion: string;
  paperOverride?: PaperFormat;
  issuedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryJob = {
  id: string;
  invoiceId: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  idempotencyKey: string;
  message?: string;
  updatedAt: string;
};

export type IssuedInvoiceResult = {
  document: InvoiceDocumentModel;
  pdfBlob?: Blob;
  whatsapp: DeliveryJob;
  email: DeliveryJob;
};
