import { useState } from "react";
import { notify } from "@/features/notifications/notify";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { retryDeliveryJob } from "@/features/invoices/services/deliveryService";
import {
  downloadInvoicePdf,
  templateIdForPaper,
} from "@/features/invoices/services/pdfService";
import type {
  DeliveryJob,
  InvoiceDocumentModel,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";
import { formatInvoiceCurrency } from "@/features/invoices/utils/invoiceFormatter";
import { cn } from "@/lib/utils";

function StatusChip({ job }: { job: DeliveryJob }) {
  const tone =
    job.status === "Sent" || job.status === "Delivered"
      ? "bg-[#ECFDF3] text-[#16A34A]"
      : job.status === "Failed"
        ? "bg-[#FEF2F2] text-[#DC2626]"
        : job.status === "NotConfigured"
          ? "bg-[#F1F5F9] text-[#64748B]"
          : "bg-[#FFF7ED] text-[#EA580C]";
  return (
    <span
      className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}
    >
      {job.status}
    </span>
  );
}

export function InvoiceSuccessDialog({
  document,
  whatsapp,
  email,
  onView,
  onChooseTemplate,
  onPrint,
  onDone,
  onDeliveryUpdate,
}: {
  document: InvoiceDocumentModel;
  whatsapp: DeliveryJob;
  email: DeliveryJob;
  onView: () => void;
  onChooseTemplate: () => void;
  onPrint: () => void;
  onDone: () => void;
  onDeliveryUpdate: (whatsapp: DeliveryJob, email: DeliveryJob) => void;
}) {
  const [paper, setPaper] = useState<PaperFormat>("A4");
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await downloadInvoicePdf(
        document,
        templateIdForPaper(paper, document.templateId),
      );
      notify.success("PDF downloaded.");
    } catch {
      notify.error("Unable to download PDF.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async (channel: "whatsapp" | "email") => {
    setBusy(true);
    try {
      const job = channel === "whatsapp" ? whatsapp : email;
      const next = await retryDeliveryJob(job.id);
      onDeliveryUpdate(
        channel === "whatsapp" ? next : whatsapp,
        channel === "email" ? next : email,
      );
      notify.info(
        `${channel === "whatsapp" ? "WhatsApp" : "Email"} status updated.`,
      );
    } catch {
      notify.error("Unable to retry delivery.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Invoice issued successfully</DialogTitle>
        <DialogDescription>
          {document.number} ·{" "}
          {document.customer.company || document.customer.name}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 rounded-2xl bg-muted/40 p-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Invoice total</span>
          <span className="font-bold tabular-nums">
            {formatInvoiceCurrency(document.totals.grandTotal)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">PDF generation</span>
          <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-semibold text-[#16A34A]">
            Ready
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">WhatsApp</span>
          <StatusChip job={whatsapp} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Email</span>
          <StatusChip job={email} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium text-muted-foreground">
          Paper format
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(["A4", "A5", "T80", "T58"] as PaperFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-semibold",
                paper === format
                  ? "border-[#2F6BFF] bg-[#F5F8FF] text-[#2F6BFF]"
                  : "border-border",
              )}
              onClick={() => setPaper(format)}
            >
              {format === "T80" ? "80mm" : format === "T58" ? "58mm" : format}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onView}>
          View Invoice
        </Button>
        <Button size="sm" variant="outline" onClick={onChooseTemplate}>
          Choose Template
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={download}>
          Download PDF
        </Button>
        <Button size="sm" variant="outline" onClick={onPrint}>
          Print Invoice
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => resend("whatsapp")}
        >
          Resend WhatsApp
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => resend("email")}
        >
          Resend Email
        </Button>
      </div>

      <DialogFooter>
        <Button className="bg-[#2F6BFF] hover:bg-[#2558d9]" onClick={onDone}>
          Done
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
