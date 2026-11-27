import type {
  InvoiceDocumentModel,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";
import {
  renderInvoicePdfBlob,
  templateIdForPaper,
} from "@/features/invoices/services/pdfService";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";

export async function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(
    url,
    "_blank",
    "noopener,noreferrer,width=900,height=700",
  );
  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("Pop-up blocked. Allow pop-ups to print the PDF.");
  }
  const revoke = () => URL.revokeObjectURL(url);
  printWindow.addEventListener("load", () => {
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  });
  printWindow.addEventListener("beforeunload", revoke);
  return { url };
}

export async function printInvoiceDocument(
  document: InvoiceDocumentModel,
  paper?: PaperFormat,
  templateId?: string,
) {
  const prefs = loadOrgInvoicePreferences();
  const selectedPaper = paper ?? document.paperOverride ?? prefs.defaultPaper;
  const selectedTemplate =
    templateId ??
    templateIdForPaper(selectedPaper, prefs.defaultPrintTemplateId);
  const blob = await renderInvoicePdfBlob(document, selectedTemplate);
  const { url } = await printBlob(blob);
  return { url, templateId: selectedTemplate, paper: selectedPaper };
}
