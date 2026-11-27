import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  downloadInvoicePdf,
  templateIdForPaper,
} from "@/features/invoices/services/pdfService";
import { printInvoiceDocument } from "@/features/invoices/services/printService";
import type {
  InvoiceDocumentModel,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";
import { paperLabel } from "@/features/invoices/utils/invoiceFormatter";
import { cn } from "@/lib/utils";

const formats: PaperFormat[] = ["A4", "A5", "T80", "T58"];

export function PrintDialog({
  document,
  onClose,
}: {
  document: InvoiceDocumentModel;
  onClose: () => void;
}) {
  const [paper, setPaper] = useState<PaperFormat>(
    document.paperOverride ?? "A4",
  );
  const [busy, setBusy] = useState(false);

  const runPrint = async () => {
    setBusy(true);
    try {
      await printInvoiceDocument(
        document,
        paper,
        templateIdForPaper(paper, document.templateId),
      );
      toast("Print dialog opened for the invoice PDF.");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "Unable to open print preview.",
      );
    } finally {
      setBusy(false);
    }
  };

  const runDownload = async () => {
    setBusy(true);
    try {
      const templateId = templateIdForPaper(paper, document.templateId);
      await downloadInvoicePdf(document, templateId);
      toast(`Downloaded ${paperLabel(paper)} PDF.`);
    } catch {
      toast("Unable to download PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Print Invoice</DialogTitle>
        <DialogDescription>
          Choose a paper format. Only the invoice PDF will print — app chrome is
          excluded.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-2">
        {formats.map((format) => (
          <button
            key={format}
            type="button"
            className={cn(
              "rounded-xl border px-3 py-3 text-left text-sm transition",
              paper === format
                ? "border-[#2F6BFF] bg-[#F5F8FF]"
                : "border-border hover:bg-muted/40",
            )}
            onClick={() => setPaper(format)}
          >
            <span className="font-semibold">
              {format === "T80" ? "80mm" : format === "T58" ? "58mm" : format}
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground">
              {paperLabel(format)}
            </span>
          </button>
        ))}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={runDownload}
        >
          Download PDF
        </Button>
        <Button
          type="button"
          disabled={busy}
          className="bg-[#2F6BFF] hover:bg-[#2558d9]"
          onClick={runPrint}
        >
          {busy ? "Preparing…" : "Print"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
