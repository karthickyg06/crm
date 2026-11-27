import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";
import {
  InvoicePdfShell,
  StandardInvoiceBody,
} from "@/features/invoices/templates/shared";

const theme = {
  accent: "#000000",
  border: "#000000",
  muted: "#333333",
  text: "#000000",
  tableHeaderBg: "#EEEEEE",
  mono: true,
};

export function BlackAndWhiteDocument({
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
