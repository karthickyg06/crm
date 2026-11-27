import { customerSeed } from "@/features/crm/data";
import { productSeed } from "@/features/erp/demoSeed";
import { listInvoiceIndex } from "@/features/erp/demoStore";
import { buildInvoiceSeed } from "@/features/erp/historicalInvoiceSeed";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";
import {
  getInvoiceSnapshot,
  saveInvoiceSnapshot,
} from "@/features/invoices/services/snapshotStore";
import {
  buildInvoiceDocument,
  customerToInvoiceInfo,
} from "@/features/invoices/utils/invoiceFormatter";

/** Build real document snapshots for seed invoices so PDF open never uses sample content. */
export function ensureSeedInvoiceSnapshots() {
  const prefs = loadOrgInvoicePreferences();
  const invoices =
    listInvoiceIndex().length > 0 ? listInvoiceIndex() : buildInvoiceSeed();
  invoices.forEach((invoice) => {
    if (getInvoiceSnapshot(invoice.id)) return;
    const customer =
      customerSeed.find((entry) => entry.company === invoice.customer) ??
      customerSeed[0]!;
    const amountPaid = Math.max(0, invoice.total - invoice.balance);
    const status =
      invoice.status === "Paid"
        ? "Paid"
        : invoice.status === "Overdue"
          ? "Overdue"
          : amountPaid > 0
            ? "Partially Paid"
            : "Issued";

    // Approximate a single taxable line that reconciles to the list total after GST + round-off.
    const product =
      productSeed[invoice.id.charCodeAt(1) % productSeed.length] ??
      productSeed[0]!;
    const taxRate = product.gstRate || 18;
    const taxableTarget =
      Math.round((invoice.total / (1 + taxRate / 100)) * 100) / 100;

    const document = buildInvoiceDocument({
      id: invoice.id,
      number: invoice.number,
      invoiceDate: toIsoDate(invoice.invoiceDate),
      dueDate: toIsoDate(invoice.dueDate),
      status,
      company: prefs.company,
      customer: customerToInvoiceInfo(customer),
      lines: [
        {
          id: `${invoice.id}-line-1`,
          productId: product.id,
          sku: product.sku,
          name: `${product.name} — ${invoice.customer}`,
          hsnSac: product.hsnSac,
          quantity: 1,
          unit: product.unit,
          unitPrice: taxableTarget,
          discountPercent: 0,
          taxRatePercent: taxRate,
        },
      ],
      amountPaid,
      paymentMethod: amountPaid > 0 ? "Bank transfer" : "Bank transfer",
      templateId: prefs.defaultDigitalTemplateId,
      templateVersion: "1.0.0",
      supplierState: "Maharashtra",
      issuedAt: new Date().toISOString(),
    });

    // Force totals to match list row for AR consistency (avoid round drift vs seed).
    document.totals = {
      ...document.totals,
      grandTotal: invoice.total,
      amountPaid,
      balanceDue: invoice.balance,
      roundOff: 0,
    };
    saveInvoiceSnapshot(document);
  });
}

function toIsoDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  // Values like "29 Dec 2026"
  const alt = Date.parse(value.replace(",", ""));
  if (!Number.isNaN(alt)) return new Date(alt).toISOString().slice(0, 10);
  return "2026-12-01";
}
