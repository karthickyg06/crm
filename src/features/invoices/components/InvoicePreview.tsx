import { PDFViewer } from "@react-pdf/renderer";
import { createElement, useMemo } from "react";

import { getInvoiceTemplate } from "@/features/invoices/templates/templateRegistry";
import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";

export function InvoicePreview({
  document,
  templateId,
  visibility,
  className,
}: {
  document: InvoiceDocumentModel;
  templateId?: string | undefined;
  visibility?: InvoiceFieldVisibility | undefined;
  className?: string | undefined;
}) {
  const template = getInvoiceTemplate(templateId ?? document.templateId);
  const element = useMemo(
    () =>
      createElement(template.Document, {
        document: {
          ...document,
          templateId: template.id,
          templateVersion: template.version,
        },
        ...(visibility ? { visibility } : {}),
      }),
    [document, template, visibility],
  );

  return (
    <div
      className={
        className ??
        "h-[520px] w-full overflow-hidden rounded-xl border border-border bg-[#F8FAFC]"
      }
    >
      <PDFViewer
        width="100%"
        height="100%"
        showToolbar={false}
        className="h-full w-full border-0"
      >
        {element as never}
      </PDFViewer>
    </div>
  );
}
