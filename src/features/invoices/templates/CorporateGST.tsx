import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";
import {
  InvoicePdfShell,
  StandardInvoiceBody,
} from "@/features/invoices/templates/shared";

const theme = {
  accent: "#0B3B2E",
  headerBg: "#0B3B2E",
  headerText: "#FFFFFF",
  border: "#CBD5E1",
  muted: "#64748B",
  text: "#0F172A",
  tableHeaderBg: "#ECFDF5",
};

export function CorporateGSTDocument({
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
        bannerTitle="GST TAX INVOICE"
      />
    </InvoicePdfShell>
  );
}
