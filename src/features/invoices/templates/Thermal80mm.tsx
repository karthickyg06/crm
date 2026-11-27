import type { InvoiceDocumentModel } from "@/features/invoices/types/invoice.types";
import { ThermalInvoiceBody } from "@/features/invoices/templates/shared";

export function Thermal80mmDocument({
  document,
}: {
  document: InvoiceDocumentModel;
}) {
  return <ThermalInvoiceBody document={document} widthLabel="80mm" />;
}
