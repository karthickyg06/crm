import {
  applyInvoiceIssueStock,
  recomputeCustomerOutstanding,
  upsertInvoiceIndex,
} from "@/features/erp/demoStore";
import { enqueueInvoiceDelivery } from "@/features/invoices/services/deliveryService";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";
import { renderInvoicePdfBlob } from "@/features/invoices/services/pdfService";
import { printInvoiceDocument } from "@/features/invoices/services/printService";
import {
  assertUniqueInvoiceNumber,
  saveInvoiceSnapshot,
  updateInvoiceTemplate,
} from "@/features/invoices/services/snapshotStore";
import { getInvoiceTemplate } from "@/features/invoices/templates/templateRegistry";
import type {
  InvoiceDocumentModel,
  IssuedInvoiceResult,
} from "@/features/invoices/types/invoice.types";

function syncInvoiceIndex(document: InvoiceDocumentModel) {
  const listStatus =
    document.status === "Issued" || document.status === "Partially Paid"
      ? document.status === "Partially Paid"
        ? "Pending"
        : "Pending"
      : document.status;
  upsertInvoiceIndex({
    id: document.id,
    number: document.number,
    customer: document.customer.company || document.customer.name,
    invoiceDate: document.invoiceDate,
    dueDate: document.dueDate,
    total: document.totals.grandTotal,
    balance: document.totals.balanceDue,
    status: listStatus === "Draft" ? "Draft" : listStatus,
  });
}

export async function saveDraftInvoice(document: InvoiceDocumentModel) {
  assertUniqueInvoiceNumber(document.number, document.id);
  const prefs = loadOrgInvoicePreferences();
  const template = getInvoiceTemplate(
    document.templateId || prefs.defaultDigitalTemplateId,
  );
  const draft: InvoiceDocumentModel = {
    ...document,
    status: "Draft",
    templateId: template.id,
    templateVersion: template.version,
    updatedAt: new Date().toISOString(),
  };
  saveInvoiceSnapshot(draft);
  syncInvoiceIndex(draft);
  return draft;
}

export async function issueInvoice(
  document: InvoiceDocumentModel,
): Promise<IssuedInvoiceResult> {
  assertUniqueInvoiceNumber(document.number, document.id);
  const prefs = loadOrgInvoicePreferences();
  const template = getInvoiceTemplate(
    document.templateId || prefs.defaultDigitalTemplateId,
  );
  const issuedAt = new Date().toISOString();
  const issued: InvoiceDocumentModel = {
    ...document,
    status: document.status === "Paid" ? "Paid" : "Issued",
    templateId: template.id,
    templateVersion: template.version,
    issuedAt,
    updatedAt: issuedAt,
  };

  // Stock must succeed before we persist issue / enqueue delivery.
  applyInvoiceIssueStock({
    invoiceId: issued.id,
    lines: issued.lines.map((line) => ({
      ...(line.productId ? { productId: line.productId } : {}),
      quantity: line.quantity,
      name: line.name,
    })),
  });

  const pdfBlob = await renderInvoicePdfBlob(
    issued,
    template.id,
    prefs.fieldVisibility,
  );
  saveInvoiceSnapshot(issued, pdfBlob);
  syncInvoiceIndex(issued);
  recomputeCustomerOutstanding();

  const whatsapp = prefs.notifyWhatsAppOnIssue
    ? await enqueueInvoiceDelivery({
        invoiceId: issued.id,
        channel: "whatsapp",
        idempotencyKey: `${issued.id}:whatsapp:${issued.number}`,
      })
    : {
        id: `skip-wa-${issued.id}`,
        invoiceId: issued.id,
        channel: "whatsapp" as const,
        status: "NotConfigured" as const,
        idempotencyKey: `${issued.id}:whatsapp:skipped`,
        message: "WhatsApp notify disabled in preferences.",
        updatedAt: issuedAt,
      };

  const email = prefs.notifyEmailOnIssue
    ? await enqueueInvoiceDelivery({
        invoiceId: issued.id,
        channel: "email",
        idempotencyKey: `${issued.id}:email:${issued.number}`,
      })
    : {
        id: `skip-email-${issued.id}`,
        invoiceId: issued.id,
        channel: "email" as const,
        status: "NotConfigured" as const,
        idempotencyKey: `${issued.id}:email:skipped`,
        message: "Email notify disabled in preferences.",
        updatedAt: issuedAt,
      };

  if (prefs.autoOpenPrintAfterIssue) {
    try {
      await printInvoiceDocument(issued);
    } catch {
      // Print is optional; do not fail issue workflow.
    }
  }

  return { document: issued, pdfBlob, whatsapp, email };
}

export function persistInvoiceTemplateChoice(
  invoiceId: string,
  templateId: string,
) {
  const document = updateInvoiceTemplate(invoiceId, templateId);
  return document;
}
