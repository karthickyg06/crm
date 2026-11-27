import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";

import { getInvoiceTemplate } from "@/features/invoices/templates/templateRegistry";
import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";

async function withQr(
  document: InvoiceDocumentModel,
): Promise<InvoiceDocumentModel> {
  if (!document.paymentQrPayload || document.paymentQrDataUrl) return document;
  try {
    const paymentQrDataUrl = await QRCode.toDataURL(document.paymentQrPayload, {
      margin: 1,
      width: 160,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
    return { ...document, paymentQrDataUrl };
  } catch {
    return document;
  }
}

export async function renderInvoicePdfBlob(
  document: InvoiceDocumentModel,
  templateId?: string,
  visibility?: InvoiceFieldVisibility,
): Promise<Blob> {
  const prefs = loadOrgInvoicePreferences();
  const template = getInvoiceTemplate(
    templateId ?? document.templateId ?? prefs.defaultDigitalTemplateId,
  );
  const enriched = await withQr({
    ...document,
    templateId: template.id,
    templateVersion: template.version,
  });
  const resolvedVisibility = visibility ?? prefs.fieldVisibility;
  const element = createElement(template.Document, {
    document: enriched,
    visibility: resolvedVisibility,
  });
  return pdf(element as never).toBlob();
}

export async function downloadInvoicePdf(
  document: InvoiceDocumentModel,
  templateId?: string,
  filename?: string,
) {
  const blob = await renderInvoicePdfBlob(document, templateId);
  const template = getInvoiceTemplate(templateId ?? document.templateId);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `${document.number}-${template.paper}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
  return blob;
}

export function templateIdForPaper(paper: PaperFormat, preferredId?: string) {
  const preferred = preferredId ? getInvoiceTemplate(preferredId) : null;
  if (preferred && preferred.paper === paper) return preferred.id;
  if (paper === "A4") return "classic-a4";
  if (paper === "A5") return "compact-a5";
  if (paper === "T80") return "thermal-80";
  return "thermal-58";
}
