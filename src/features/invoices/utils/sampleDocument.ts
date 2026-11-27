import { customerSeed } from "@/features/crm/data";
import type { InvoiceDocumentModel } from "@/features/invoices/types/invoice.types";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";
import {
  buildInvoiceDocument,
  customerToInvoiceInfo,
} from "@/features/invoices/utils/invoiceFormatter";

export function createSampleInvoiceDocument(
  templateId = "classic-a4",
  templateVersion = "1.0.0",
): InvoiceDocumentModel {
  const prefs = loadOrgInvoicePreferences();
  const customer = customerSeed[0]!;
  return buildInvoiceDocument({
    id: "sample-invoice",
    number: "INV-2026-0052",
    invoiceDate: "2026-12-29",
    dueDate: "2027-01-28",
    status: "Issued",
    company: prefs.company,
    customer: customerToInvoiceInfo(customer, "Maharashtra"),
    lines: [
      {
        id: "l1",
        name: "Brand strategy and design retainer",
        hsnSac: "998314",
        quantity: 1,
        unit: "month",
        unitPrice: 80000,
        discountPercent: 0,
        taxRatePercent: 18,
      },
      {
        id: "l2",
        name: "Website redesign milestone",
        hsnSac: "998314",
        quantity: 1,
        unit: "project",
        unitPrice: 45000,
        discountPercent: 10,
        taxRatePercent: 18,
      },
    ],
    amountPaid: 0,
    paymentMethod: "Bank transfer",
    paymentQrPayload:
      "upi://pay?pa=billing@yaglob&pn=Yaglob%20Studio&am=144330.00",
    notes: "Net 30 payment terms.",
    templateId,
    templateVersion,
    supplierState: "Maharashtra",
    issuedAt: new Date().toISOString(),
  });
}
