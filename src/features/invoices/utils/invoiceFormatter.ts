import type { Customer } from "@/features/crm/data";
import type {
  InvoiceCompany,
  InvoiceCustomerInfo,
  InvoiceDocumentModel,
  InvoiceLineInput,
  OrgInvoicePreferences,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";
import {
  computeLines,
  computeTotals,
  resolveTaxMode,
} from "@/features/invoices/utils/calculations";

export function formatInvoiceCurrency(value: number, withDecimals = true) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(value);
}

export function formatInvoiceDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function paperLabel(paper: PaperFormat) {
  if (paper === "A4") return "A4 (210 × 297 mm)";
  if (paper === "A5") return "A5 (148 × 210 mm)";
  if (paper === "T80") return "Thermal 80 mm";
  return "Thermal 58 mm";
}

export function nextInvoiceNumber(format: string, sequence: number) {
  const year = new Date().getFullYear();
  return format
    .replaceAll("{YYYY}", String(year))
    .replaceAll("{YY}", String(year).slice(-2))
    .replaceAll("{####}", String(sequence).padStart(4, "0"))
    .replaceAll("{###}", String(sequence).padStart(3, "0"));
}

export function customerToInvoiceInfo(
  customer: Customer,
  placeOfSupply?: string,
): InvoiceCustomerInfo {
  const resolvedPlace = placeOfSupply ?? extractState(customer.billingAddress);
  return {
    name: customer.name,
    company: customer.company,
    billingAddress: customer.billingAddress,
    shippingAddress: customer.shippingAddress,
    gstin: customer.gstin,
    ...(resolvedPlace ? { placeOfSupply: resolvedPlace } : {}),
    phone: customer.phone,
    whatsappNumber: customer.whatsappNumber || customer.phone,
    email: customer.email,
  };
}

function extractState(address?: string) {
  if (!address) return undefined;
  const match = address.match(/,\s*([^,]+)\s+\d{6}/);
  return match?.[1]?.trim();
}

export function buildInvoiceDocument(input: {
  id: string;
  number: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceDocumentModel["status"];
  company: InvoiceCompany;
  customer: InvoiceCustomerInfo;
  lines: InvoiceLineInput[];
  amountPaid?: number;
  paymentMethod?: string;
  paymentQrPayload?: string;
  notes?: string;
  templateId: string;
  templateVersion: string;
  paperOverride?: PaperFormat;
  supplierState?: string;
  issuedAt?: string;
  createdAt?: string;
}): InvoiceDocumentModel {
  const computedLines = computeLines(input.lines);
  const taxMode = resolveTaxMode(
    input.supplierState,
    input.customer.placeOfSupply,
  );
  const totals = computeTotals(computedLines, taxMode, input.amountPaid ?? 0);
  const now = new Date().toISOString();
  const document: InvoiceDocumentModel = {
    id: input.id,
    number: input.number,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate,
    status: input.status,
    company: input.company,
    customer: input.customer,
    lines: computedLines,
    totals,
    taxMode,
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
  if (input.paymentMethod) document.paymentMethod = input.paymentMethod;
  if (input.paymentQrPayload)
    document.paymentQrPayload = input.paymentQrPayload;
  if (input.notes) document.notes = input.notes;
  if (input.paperOverride) document.paperOverride = input.paperOverride;
  if (input.issuedAt) document.issuedAt = input.issuedAt;
  return document;
}

export const defaultCompany: InvoiceCompany = {
  name: "Yaglob Studio",
  address: "12, Maker Chambers, Mumbai, Maharashtra 400021",
  gstin: "27AABCY1234D1Z5",
  phone: "+91 98765 00000",
  email: "billing@yaglob.co",
  bankName: "HDFC Bank",
  bankAccount: "50200012345678",
  bankIfsc: "HDFC0001234",
  brandColor: "#2F6BFF",
  footerMessage: "Thank you for your business.",
  terms: "Payment due within 30 days. Interest may apply on overdue balances.",
  signatureLabel: "Authorized Signatory",
};

export const defaultFieldVisibility = {
  logo: true,
  shippingAddress: true,
  customerGstin: true,
  hsnSac: true,
  bankDetails: true,
  paymentQr: true,
  terms: true,
  signature: true,
};

export function createDefaultOrgPreferences(): OrgInvoicePreferences {
  return {
    orgId: "default",
    defaultDigitalTemplateId: "classic-a4",
    defaultPrintTemplateId: "classic-a4",
    defaultPaper: "A4",
    company: defaultCompany,
    numberingFormat: "INV-{YYYY}-{####}",
    fieldVisibility: defaultFieldVisibility,
    autoOpenPrintAfterIssue: false,
    notifyWhatsAppOnIssue: true,
    notifyEmailOnIssue: true,
  };
}
