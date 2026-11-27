import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { notify, recordAndToast } from "@/features/notifications/notify";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ACTION_ICONS,
  ActionIconButton,
  AppShell,
  DataTable,
  MetricCard,
  MetricGrid,
  PageHeader,
  StatusBadge,
  currency,
  type DataColumn,
} from "@/features/crm/shared";
import { useAuth } from "@/features/auth/useAuth";
import {
  getCustomerById,
  listQuotations,
  markQuotationConverted,
} from "@/features/erp/demoStore";
import type { Quotation } from "@/features/erp/types";
import { InvoiceForm } from "@/features/invoices/components/InvoiceForm";
import { InvoicePreview } from "@/features/invoices/components/InvoicePreview";
import { downloadInvoicePdf } from "@/features/invoices/services/pdfService";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";
import type { IssuedInvoiceResult } from "@/features/invoices/types/invoice.types";
import {
  buildInvoiceDocument,
  customerToInvoiceInfo,
} from "@/features/invoices/utils/invoiceFormatter";
import { QuotationForm } from "@/features/quotations/QuotationForm";

function quotationToPreviewDocument(quotation: Quotation) {
  const prefs = loadOrgInvoicePreferences();
  const customer = getCustomerById(quotation.customerId);
  return buildInvoiceDocument({
    id: quotation.id,
    number: quotation.number,
    invoiceDate: quotation.quoteDate,
    dueDate: quotation.validUntil,
    status: "Draft",
    company: {
      ...prefs.company,
      terms: "This is a quotation, not a tax invoice.",
      footerMessage: "Quotation — prices valid until the date shown.",
    },
    customer: customer
      ? customerToInvoiceInfo(customer)
      : {
          name: quotation.customerName,
          company: quotation.company,
        },
    lines: quotation.lines.map((line) => ({
      id: line.id,
      ...(line.productId ? { productId: line.productId } : {}),
      ...(line.sku ? { sku: line.sku } : {}),
      name: line.name,
      ...(line.hsnSac ? { hsnSac: line.hsnSac } : {}),
      quantity: line.quantity,
      ...(line.unit ? { unit: line.unit } : {}),
      unitPrice: line.unitPrice,
      ...(line.discountPercent != null
        ? { discountPercent: line.discountPercent }
        : {}),
      ...(line.taxRatePercent != null
        ? { taxRatePercent: line.taxRatePercent }
        : {}),
    })),
    amountPaid: 0,
    ...(quotation.notes ? { notes: quotation.notes } : {}),
    templateId: prefs.defaultDigitalTemplateId,
    templateVersion: "1.0.0",
    supplierState: "Maharashtra",
  });
}

export function QuotationsPage() {
  const { can } = useAuth();
  const canCreate = can("quotations", "create");
  const canEdit = can("quotations", "edit");
  const canDownload = can("quotations", "download");
  const canConvert =
    can("invoices", "create") && can("invoices", "issue-invoice");
  const [quotations, setQuotations] = useState(() => listQuotations());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertSource, setConvertSource] = useState<Quotation | null>(null);

  const refresh = () => setQuotations(listQuotations());

  const startConvert = (quotation: Quotation) => {
    if (quotation.status === "Converted" || quotation.convertedInvoiceId) {
      notify.warning("This quotation was already converted.");
      return;
    }
    if (quotation.status !== "Accepted") {
      notify.warning("Only accepted quotations can be converted.");
      return;
    }
    setConvertSource(quotation);
    setConvertOpen(true);
  };

  const columns: DataColumn<Quotation>[] = [
    {
      id: "number",
      label: "Quote #",
      render: (row) => (
        <button
          type="button"
          className="font-semibold text-[#2F6BFF] hover:underline"
          onClick={() => {
            if (!canEdit) {
              setSelected(row);
              setPreviewOpen(true);
              return;
            }
            setEditing(row);
            setFormOpen(true);
          }}
        >
          {row.number}
        </button>
      ),
    },
    { id: "customer", label: "Customer", render: (row) => row.company },
    { id: "date", label: "Date", render: (row) => row.quoteDate },
    { id: "valid", label: "Valid until", render: (row) => row.validUntil },
    {
      id: "total",
      label: "Total",
      render: (row) => (
        <span className="tabular-nums font-semibold">
          {currency(row.grandTotal)}
        </span>
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "actions",
      label: "",
      className: "w-[120px] text-right",
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-0.5">
          <ActionIconButton
            icon={ACTION_ICONS.view}
            label="Preview quotation"
            onClick={() => {
              setSelected(row);
              setPreviewOpen(true);
            }}
          />
          {canDownload ? (
            <ActionIconButton
              icon={ACTION_ICONS.download}
              label="Download PDF"
              onClick={() => {
                void downloadInvoicePdf(quotationToPreviewDocument(row))
                  .then(() => notify.success("Quotation PDF downloaded."))
                  .catch(() =>
                    notify.error("Unable to download quotation PDF."),
                  );
              }}
            />
          ) : null}
          {canConvert ? (
            <Button
              size="sm"
              className="h-8 shrink-0 gap-1.5 rounded-lg bg-[#2F6BFF] px-2.5 text-xs text-white hover:bg-[#2558d9]"
              disabled={row.status === "Converted"}
              onClick={() => startConvert(row)}
            >
              Convert
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Quotations"
        description="Create quotes, send PDFs, and convert accepted quotes into invoices once."
        actions={
          canCreate ? (
            <Button
              size="sm"
              className="h-11 rounded-xl bg-[#2F6BFF] px-5 text-sm font-semibold text-white hover:bg-[#2558d9]"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Create quotation
            </Button>
          ) : null
        }
      />
      <MetricGrid>
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          label="Total quotes"
          value={String(quotations.length)}
          change="0%"
        />
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          label="Accepted"
          value={String(
            quotations.filter((q) => q.status === "Accepted").length,
          )}
          change="0%"
        />
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          label="Converted"
          value={String(
            quotations.filter((q) => q.status === "Converted").length,
          )}
          change="0%"
        />
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          label="Pipeline value"
          value={currency(
            quotations
              .filter(
                (q) => q.status !== "Rejected" && q.status !== "Converted",
              )
              .reduce((sum, q) => sum + q.grandTotal, 0),
          )}
          change="0%"
        />
      </MetricGrid>
      <DataTable
        rows={quotations}
        columns={columns}
        searchPlaceholder="Search quotations…"
        filterKey="status"
        filterOptions={[
          "Draft",
          "Sent",
          "Accepted",
          "Rejected",
          "Expired",
          "Converted",
        ]}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <QuotationForm
          editing={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selected?.number}</DialogTitle>
            <DialogDescription>
              Quotation preview using the invoice PDF engine.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <InvoicePreview
              document={quotationToPreviewDocument(selected)}
              className="h-[70vh]"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        {convertSource && (
          <InvoiceForm
            canIssue={can("invoices", "issue-invoice")}
            canSaveDraft={can("invoices", "create")}
            initial={{
              customerId: convertSource.customerId,
              ...(convertSource.notes ? { notes: convertSource.notes } : {}),
              lines: convertSource.lines.map((line) => ({
                id: line.id,
                ...(line.productId ? { productId: line.productId } : {}),
                ...(line.sku ? { sku: line.sku } : {}),
                name: line.name,
                ...(line.hsnSac ? { hsnSac: line.hsnSac } : {}),
                quantity: line.quantity,
                ...(line.unit ? { unit: line.unit } : {}),
                unitPrice: line.unitPrice,
                ...(line.discountPercent != null
                  ? { discountPercent: line.discountPercent }
                  : {}),
                ...(line.taxRatePercent != null
                  ? { taxRatePercent: line.taxRatePercent }
                  : {}),
              })),
              quotationId: convertSource.id,
            }}
            onCancel={() => setConvertOpen(false)}
            onDraftSaved={(document) => {
              try {
                markQuotationConverted(convertSource.id, document.id);
                setConvertOpen(false);
                refresh();
                recordAndToast({
                  module: "quotations",
                  eventType: "quotation.converted_draft",
                  title: "Quotation converted",
                  description: `${convertSource.number} → draft ${document.number}`,
                  severity: "success",
                  operationStatus: "succeeded",
                  relatedRecordId: document.id,
                  relatedRoute: "/invoices",
                  idempotencyKey: `quote-convert-draft-${convertSource.id}-${document.id}`,
                });
              } catch (error) {
                notify.error(
                  error instanceof Error ? error.message : "Conversion failed.",
                );
              }
            }}
            onIssued={(result: IssuedInvoiceResult) => {
              try {
                markQuotationConverted(convertSource.id, result.document.id);
                setConvertOpen(false);
                refresh();
                recordAndToast({
                  module: "quotations",
                  eventType: "quotation.converted_issued",
                  title: "Quotation converted and issued",
                  description: `${convertSource.number} → ${result.document.number}`,
                  severity: "success",
                  operationStatus: "succeeded",
                  relatedRecordId: result.document.id,
                  relatedRoute: "/invoices",
                  idempotencyKey: `quote-convert-issue-${convertSource.id}-${result.document.id}`,
                });
              } catch (error) {
                notify.error(
                  error instanceof Error ? error.message : "Conversion failed.",
                );
              }
            }}
          />
        )}
      </Dialog>
    </AppShell>
  );
}
