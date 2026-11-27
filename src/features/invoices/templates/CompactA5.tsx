import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";
import {
  InvoicePdfShell,
  StandardInvoiceBody,
} from "@/features/invoices/templates/shared";

const theme = {
  accent: "#1D4ED8",
  border: "#CBD5E1",
  muted: "#64748B",
  text: "#0F172A",
  tableHeaderBg: "#F1F5F9",
};

export function CompactA5Document({
  document,
  visibility,
}: {
  document: InvoiceDocumentModel;
  visibility?: InvoiceFieldVisibility | undefined;
}) {
  return (
    <InvoicePdfShell
      document={document}
      paper="A5"
      theme={theme}
      visibility={visibility}
      compact
    >
      <StandardInvoiceBody
        document={document}
        theme={theme}
        visibility={visibility}
        compact
      />
    </InvoicePdfShell>
  );
}
