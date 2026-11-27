import type { ComponentType } from "react";

import { BlackAndWhiteDocument } from "@/features/invoices/templates/BlackAndWhite";
import { ClassicA4Document } from "@/features/invoices/templates/ClassicA4";
import { CompactA5Document } from "@/features/invoices/templates/CompactA5";
import { CorporateGSTDocument } from "@/features/invoices/templates/CorporateGST";
import { ModernA4Document } from "@/features/invoices/templates/ModernA4";
import { ProfessionalA4Document } from "@/features/invoices/templates/ProfessionalA4";
import { Thermal58mmDocument } from "@/features/invoices/templates/Thermal58mm";
import { Thermal80mmDocument } from "@/features/invoices/templates/Thermal80mm";
import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";

export type InvoiceTemplateComponent = ComponentType<{
  document: InvoiceDocumentModel;
  visibility?: InvoiceFieldVisibility | undefined;
}>;

export type InvoiceTemplateDefinition = {
  id: string;
  name: string;
  paper: PaperFormat;
  category: "digital" | "print" | "thermal";
  version: string;
  description: string;
  Document: InvoiceTemplateComponent;
};

export const invoiceTemplates: InvoiceTemplateDefinition[] = [
  {
    id: "classic-a4",
    name: "Classic Standard",
    paper: "A4",
    category: "digital",
    version: "1.0.0",
    description: "Clean professional A4 invoice for everyday billing.",
    Document: ClassicA4Document,
  },
  {
    id: "professional-a4",
    name: "Professional Blue",
    paper: "A4",
    category: "digital",
    version: "1.0.0",
    description: "Blue branded tax invoice with strong header emphasis.",
    Document: ProfessionalA4Document,
  },
  {
    id: "modern-a4",
    name: "Modern Minimal",
    paper: "A4",
    category: "digital",
    version: "1.0.0",
    description: "Minimal layout with generous whitespace.",
    Document: ModernA4Document,
  },
  {
    id: "corporate-gst-a4",
    name: "Corporate GST",
    paper: "A4",
    category: "digital",
    version: "1.0.0",
    description: "GST-forward corporate invoice for Indian businesses.",
    Document: CorporateGSTDocument,
  },
  {
    id: "bw-a4",
    name: "Black & White",
    paper: "A4",
    category: "print",
    version: "1.0.0",
    description: "High-contrast mono layout for economical printing.",
    Document: BlackAndWhiteDocument,
  },
  {
    id: "compact-a5",
    name: "Compact A5",
    paper: "A5",
    category: "print",
    version: "1.0.0",
    description: "Dense A5 invoice for compact paper stock.",
    Document: CompactA5Document,
  },
  {
    id: "thermal-80",
    name: "Thermal 80mm",
    paper: "T80",
    category: "thermal",
    version: "1.0.0",
    description: "Dedicated 80mm receipt layout for thermal printers.",
    Document: Thermal80mmDocument,
  },
  {
    id: "thermal-58",
    name: "Thermal 58mm",
    paper: "T58",
    category: "thermal",
    version: "1.0.0",
    description: "Dedicated 58mm mini receipt layout.",
    Document: Thermal58mmDocument,
  },
];

export function getInvoiceTemplate(id: string) {
  return (
    invoiceTemplates.find((template) => template.id === id) ??
    invoiceTemplates[0]!
  );
}

export function getTemplatesByPaper(paper: PaperFormat) {
  return invoiceTemplates.filter((template) => template.paper === paper);
}

export function listInvoiceTemplateIds() {
  return invoiceTemplates.map((template) => template.id);
}
