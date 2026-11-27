import type { InvoiceDocumentModel } from "@/features/invoices/types/invoice.types";
import { getInvoiceTemplate } from "@/features/invoices/templates/templateRegistry";

const DOCS_KEY = "yaglob.invoice.snapshots.default";
const BLOB_PREFIX = "yaglob.invoice.pdf.";

type SnapshotRecord = {
  document: InvoiceDocumentModel;
  pdfDataUrl?: string;
};

function readAll(): Record<string, SnapshotRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DOCS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SnapshotRecord>) : {};
  } catch {
    return {};
  }
}

function writeAll(records: Record<string, SnapshotRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOCS_KEY, JSON.stringify(records));
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mime = header?.match(/:(.*?);/)?.[1] ?? "application/pdf";
  const binary = atob(data ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function findSnapshotByNumber(number: string, excludeId?: string) {
  return (
    Object.values(readAll()).find(
      (record) =>
        record.document.number === number && record.document.id !== excludeId,
    ) ?? null
  );
}

export function assertUniqueInvoiceNumber(number: string, excludeId?: string) {
  const existing = findSnapshotByNumber(number, excludeId);
  if (existing) {
    throw new Error(`Invoice number ${number} already exists.`);
  }
}

export function saveInvoiceSnapshot(
  document: InvoiceDocumentModel,
  pdfBlob?: Blob,
) {
  assertUniqueInvoiceNumber(document.number, document.id);
  const records = readAll();
  const existing = records[document.id];
  const next: SnapshotRecord = {
    document: {
      ...document,
      updatedAt: new Date().toISOString(),
    },
  };
  if (existing?.pdfDataUrl) next.pdfDataUrl = existing.pdfDataUrl;
  records[document.id] = next;
  writeAll(records);

  if (pdfBlob) {
    void blobToDataUrl(pdfBlob).then((pdfDataUrl) => {
      const latest = readAll();
      if (!latest[document.id]) return;
      latest[document.id] = { ...latest[document.id]!, pdfDataUrl };
      writeAll(latest);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `${BLOB_PREFIX}${document.id}`,
          pdfDataUrl,
        );
      }
    });
  }

  return records[document.id]!;
}

export function updateInvoiceTemplate(invoiceId: string, templateId: string) {
  const records = readAll();
  const existing = records[invoiceId];
  if (!existing) throw new Error("Invoice snapshot not found.");
  const template = getInvoiceTemplate(templateId);
  const document: InvoiceDocumentModel = {
    ...existing.document,
    templateId: template.id,
    templateVersion: template.version,
    updatedAt: new Date().toISOString(),
  };
  records[invoiceId] = { ...existing, document };
  writeAll(records);
  return document;
}

export function getInvoiceSnapshot(id: string) {
  return readAll()[id] ?? null;
}

export function listInvoiceSnapshots() {
  return Object.values(readAll()).map((record) => record.document);
}

export function getStoredPdfBlob(id: string) {
  const record = getInvoiceSnapshot(id);
  const dataUrl =
    record?.pdfDataUrl ??
    (typeof window !== "undefined"
      ? window.sessionStorage.getItem(`${BLOB_PREFIX}${id}`)
      : null);
  if (!dataUrl) return null;
  return dataUrlToBlob(dataUrl);
}

export function deleteInvoiceSnapshot(id: string) {
  const records = readAll();
  delete records[id];
  writeAll(records);
  if (typeof window !== "undefined")
    window.sessionStorage.removeItem(`${BLOB_PREFIX}${id}`);
}

export function clearInvoiceSnapshots() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DOCS_KEY);
}
