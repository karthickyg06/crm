import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";
import {
  InvoicePdfShell,
  StandardInvoiceBody,
} from "@/features/invoices/templates/shared";

const theme = {
  accent: "#2F6BFF",
  headerBg: "#2F6BFF",
  headerText: "#FFFFFF",
  border: "#DBEAFE",
  muted: "#64748B",
  text: "#0F172A",
  tableHeaderBg: "#EFF6FF",
};

export function ProfessionalA4Document({
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
        showBanner
        bannerTitle="TAX INVOICE"
      />
    </InvoicePdfShell>
  );
}
