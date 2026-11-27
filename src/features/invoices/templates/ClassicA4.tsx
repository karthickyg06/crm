import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";
import {
  InvoicePdfShell,
  StandardInvoiceBody,
} from "@/features/invoices/templates/shared";

const theme = {
  accent: "#111827",
  border: "#D1D5DB",
  muted: "#6B7280",
  text: "#111827",
  tableHeaderBg: "#F3F4F6",
};

export function ClassicA4Document({
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
