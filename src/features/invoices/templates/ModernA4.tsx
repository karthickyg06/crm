import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";
import {
  InvoicePdfShell,
  StandardInvoiceBody,
} from "@/features/invoices/templates/shared";

const theme = {
  accent: "#0F172A",
  border: "#E2E8F0",
  muted: "#94A3B8",
  text: "#0F172A",
  tableHeaderBg: "#F8FAFC",
};

export function ModernA4Document({
  document,
  visibility,
}: {
  document: InvoiceDocumentModel;
  visibility?: InvoiceFieldVisibility | undefined;
}) {
  return (
    <InvoicePdfShell
      document={document}
      paper="A4"
      theme={theme}
      visibility={visibility}
    >
      <StandardInvoiceBody
        document={document}
        theme={theme}
        visibility={visibility}
      />
    </InvoicePdfShell>
  );
}
