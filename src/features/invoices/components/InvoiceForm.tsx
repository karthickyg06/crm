import { useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { notify, recordAndToast } from "@/features/notifications/notify";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCustomerById,
  loadCustomers,
  listProducts,
} from "@/features/erp/demoStore";
import type { Product } from "@/features/erp/types";
import { FormField, currency } from "@/features/crm/shared";
import {
  issueInvoice,
  saveDraftInvoice,
} from "@/features/invoices/services/issueService";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";
import { getInvoiceTemplate } from "@/features/invoices/templates/templateRegistry";
import type {
  InvoiceDocumentModel,
  InvoiceLineInput,
  IssuedInvoiceResult,
} from "@/features/invoices/types/invoice.types";
import { validateInvoiceLines } from "@/features/invoices/utils/calculations";
import {
  buildInvoiceDocument,
  customerToInvoiceInfo,
  formatInvoiceCurrency,
  nextInvoiceNumber,
} from "@/features/invoices/utils/invoiceFormatter";

type DraftLine = InvoiceLineInput & { stockHint?: number };

function emptyLine(id: string): DraftLine {
  return {
    id,
    name: "",
    hsnSac: "",
    quantity: 1,
    unit: "service",
    unitPrice: 0,
    discountPercent: 0,
    taxRatePercent: 18,
  };
}

function applyProduct(line: DraftLine, product: Product): DraftLine {
  const next: DraftLine = {
    ...line,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    hsnSac: product.hsnSac,
    unit: product.unit,
    unitPrice: product.sellingPrice,
    taxRatePercent: product.gstRate,
  };
  if (product.kind === "product") next.stockHint = product.stockQty;
  else delete next.stockHint;
  return next;
}

export function InvoiceForm({
  onCancel,
  onIssued,
  onDraftSaved,
  initial,
  canIssue = true,
  canSaveDraft = true,
}: {
  onCancel: () => void;
  onIssued: (result: IssuedInvoiceResult) => void;
  onDraftSaved: (document: InvoiceDocumentModel) => void;
  initial?: {
    customerId?: string;
    lines?: InvoiceLineInput[];
    notes?: string;
    number?: string;
    quotationId?: string;
  };
  canIssue?: boolean;
  canSaveDraft?: boolean;
}) {
  const prefs = loadOrgInvoicePreferences();
  const customers = loadCustomers();
  const products = listProducts();
  const [customerId, setCustomerId] = useState(
    initial?.customerId ?? customers[0]?.id ?? "",
  );
  const [number, setNumber] = useState(
    initial?.number ?? nextInvoiceNumber(prefs.numberingFormat, 53),
  );
  const [invoiceDate, setInvoiceDate] = useState("2026-12-29");
  const [dueDate, setDueDate] = useState("2027-01-28");
  const [lines, setLines] = useState<DraftLine[]>(
    initial?.lines?.length
      ? initial.lines.map((line) => ({ ...line }))
      : [emptyLine("line-1")],
  );
  const [terms, setTerms] = useState("Due within 30 days");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [templateId, setTemplateId] = useState(prefs.defaultDigitalTemplateId);
  const [busy, setBusy] = useState(false);

  const customer = getCustomerById(customerId) ?? customers[0]!;
  const [billingDetails, setBillingDetails] = useState(
    customer?.billingAddress ?? "",
  );
  const [shippingDetails, setShippingDetails] = useState(
    customer?.shippingAddress ?? "",
  );

  const previewDoc = useMemo(() => {
    const template = getInvoiceTemplate(templateId);
    return buildInvoiceDocument({
      id: `invoice-${number}`,
      number,
      invoiceDate,
      dueDate,
      status: "Draft",
      company: {
        ...prefs.company,
        ...(terms || prefs.company.terms
          ? { terms: terms || prefs.company.terms }
          : {}),
      },
      customer: {
        ...customerToInvoiceInfo(customer),
        billingAddress: billingDetails || customer.billingAddress,
        shippingAddress: shippingDetails || customer.shippingAddress,
      },
      lines,
      amountPaid: 0,
      paymentMethod: "Bank transfer",
      paymentQrPayload: `upi://pay?pa=billing@yaglob&pn=${encodeURIComponent(prefs.company.name)}`,
      ...(notes ? { notes } : {}),
      templateId: template.id,
      templateVersion: template.version,
      supplierState: "Maharashtra",
    });
  }, [
    billingDetails,
    customer,
    dueDate,
    invoiceDate,
    lines,
    notes,
    number,
    prefs.company,
    shippingDetails,
    templateId,
    terms,
  ]);

  const buildCurrent = (status: InvoiceDocumentModel["status"]) => {
    const template = getInvoiceTemplate(templateId);
    return buildInvoiceDocument({
      id: `invoice-${Date.now()}`,
      number,
      invoiceDate,
      dueDate,
      status,
      company: {
        ...prefs.company,
        ...(terms || prefs.company.terms
          ? { terms: terms || prefs.company.terms }
          : {}),
      },
      customer: {
        ...customerToInvoiceInfo(customer),
        billingAddress: billingDetails || customer.billingAddress,
        shippingAddress: shippingDetails || customer.shippingAddress,
      },
      lines,
      amountPaid: 0,
      paymentMethod: "Bank transfer",
      paymentQrPayload: `upi://pay?pa=billing@yaglob&pn=${encodeURIComponent(prefs.company.name)}`,
      ...(notes ? { notes } : {}),
      templateId: template.id,
      templateVersion: template.version,
      supplierState: "Maharashtra",
    });
  };

  const saveDraft = async (event?: FormEvent) => {
    event?.preventDefault();
    const errors = validateInvoiceLines(lines);
    if (errors.length) {
      notify.warning(errors[0]!);
      return;
    }
    setBusy(true);
    try {
      const draft = await saveDraftInvoice(buildCurrent("Draft"));
      onDraftSaved(draft);
      recordAndToast({
        module: "invoices",
        eventType: "invoice.draft_saved",
        title: "Invoice draft saved",
        description: draft.number,
        severity: "success",
        operationStatus: "succeeded",
        relatedRecordId: draft.id,
        relatedRoute: "/invoices",
        idempotencyKey: `invoice-draft-${draft.id}-${draft.updatedAt}`,
      });
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Unable to save draft.",
      );
    } finally {
      setBusy(false);
    }
  };

  const saveAndIssue = async (event: FormEvent) => {
    event.preventDefault();
    const errors = validateInvoiceLines(lines);
    if (errors.length) {
      notify.warning(errors[0]!);
      return;
    }
    setBusy(true);
    try {
      const result = await issueInvoice(buildCurrent("Issued"));
      onIssued(result);
      recordAndToast({
        module: "invoices",
        eventType: "invoice.issued",
        title: "Invoice issued",
        description: result.document.number,
        severity: "success",
        operationStatus: "succeeded",
        relatedRecordId: result.document.id,
        relatedRoute: "/invoices",
        idempotencyKey: `invoice-issue-${result.document.id}`,
      });
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Unable to issue invoice.",
      );
    } finally {
      setBusy(false);
    }
  };

  const updateLine = (id: string, patch: Partial<DraftLine>) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Create invoice</DialogTitle>
        <DialogDescription>
          Select a customer and products, then save as draft or save & issue
          with PDF generation.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={saveAndIssue} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Customer" required>
            <Select
              value={customerId}
              onValueChange={(value) => {
                setCustomerId(value);
                const next = getCustomerById(value);
                if (next) {
                  setBillingDetails(next.billingAddress);
                  setShippingDetails(next.shippingAddress);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customers.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.company} — {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Invoice number" required>
            <Input
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Invoice date" required>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Due date" required>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-muted-foreground">Phone</span>
            <p className="font-medium">{customer.phone || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">WhatsApp</span>
            <p className="font-medium">
              {customer.whatsappNumber || customer.phone || "—"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Email</span>
            <p className="font-medium">{customer.email || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">GSTIN</span>
            <p className="font-medium">{customer.gstin || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">Company</span>
            <p className="font-medium">{customer.company}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Billing address">
            <Textarea
              rows={2}
              value={billingDetails}
              onChange={(event) => setBillingDetails(event.target.value)}
            />
          </FormField>
          <FormField label="Shipping address">
            <Textarea
              rows={2}
              value={shippingDetails}
              onChange={(event) => setShippingDetails(event.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Template">
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic-a4">Classic Standard</SelectItem>
              <SelectItem value="professional-a4">Professional Blue</SelectItem>
              <SelectItem value="modern-a4">Modern Minimal</SelectItem>
              <SelectItem value="corporate-gst-a4">Corporate GST</SelectItem>
              <SelectItem value="bw-a4">Black & White</SelectItem>
              <SelectItem value="compact-a5">Compact A5</SelectItem>
              <SelectItem value="thermal-80">Thermal 80mm</SelectItem>
              <SelectItem value="thermal-58">Thermal 58mm</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="space-y-2 rounded-md border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
            <p className="text-xs font-semibold">Line items</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    emptyLine(`line-${Date.now()}`),
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Manual service
              </Button>
            </div>
          </div>
          <div className="hidden gap-2 border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
            <span>Product / Service</span>
            <span>Item name</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="hidden gap-2 border-b border-border bg-muted/20 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground sm:grid sm:grid-cols-6">
            <span>SKU</span>
            <span>HSN / SAC</span>
            <span>Quantity</span>
            <span>Unit Price (₹)</span>
            <span>Discount %</span>
            <span>GST %</span>
          </div>
          {lines.map((line) => (
            <div
              key={line.id}
              className="space-y-2 border-b border-border p-3 last:border-b-0"
            >
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    Product / Service
                  </span>
                  <Select
                    value={line.productId ?? "manual"}
                    onValueChange={(value) => {
                      if (value === "manual") {
                        setLines((current) =>
                          current.map((entry) => {
                            if (entry.id !== line.id) return entry;
                            const next = { ...entry };
                            delete next.productId;
                            delete next.sku;
                            delete next.stockHint;
                            return next;
                          }),
                        );
                        return;
                      }
                      const product = products.find(
                        (entry) => entry.id === value,
                      );
                      if (product)
                        updateLine(line.id, applyProduct(line, product));
                    }}
                  >
                    <SelectTrigger aria-label="Product / Service">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        Manual service line
                      </SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    Item name
                  </span>
                  <Input
                    value={line.name}
                    onChange={(event) =>
                      updateLine(line.id, { name: event.target.value })
                    }
                    placeholder="Item name"
                    aria-label="Item name"
                    required
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={lines.length === 1}
                  aria-label="Remove line"
                  onClick={() =>
                    setLines((current) =>
                      current.filter((entry) => entry.id !== line.id),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    SKU
                  </span>
                  <Input
                    value={line.sku ?? ""}
                    onChange={(event) =>
                      updateLine(line.id, { sku: event.target.value })
                    }
                    placeholder="SKU"
                    aria-label="SKU"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    HSN / SAC
                  </span>
                  <Input
                    value={line.hsnSac ?? ""}
                    onChange={(event) =>
                      updateLine(line.id, { hsnSac: event.target.value })
                    }
                    placeholder="HSN/SAC"
                    aria-label="HSN / SAC"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    Quantity
                  </span>
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.id, {
                        quantity: Number(event.target.value) || 0,
                      })
                    }
                    aria-label="Quantity"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    Unit Price (₹)
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={line.unitPrice}
                    onChange={(event) =>
                      updateLine(line.id, {
                        unitPrice: Number(event.target.value) || 0,
                      })
                    }
                    aria-label="Unit Price"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    Discount %
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={line.discountPercent ?? 0}
                    onChange={(event) =>
                      updateLine(line.id, {
                        discountPercent: Number(event.target.value) || 0,
                      })
                    }
                    aria-label="Discount %"
                  />
                </div>
                <div className="grid gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground sm:hidden">
                    GST %
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={line.taxRatePercent ?? 0}
                    onChange={(event) =>
                      updateLine(line.id, {
                        taxRatePercent: Number(event.target.value) || 0,
                      })
                    }
                    aria-label="GST %"
                  />
                </div>
              </div>
              {typeof line.stockHint === "number" && (
                <p className="text-[11px] text-muted-foreground">
                  Available stock: {line.stockHint} {line.unit}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Payment terms">
            <Input
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
            />
          </FormField>
          <FormField label="Notes">
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add a note for your customer"
            />
          </FormField>
        </div>
        <div className="ml-auto grid w-full max-w-xs gap-2 rounded-md bg-muted/50 p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatInvoiceCurrency(previewDoc.totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>
              −{formatInvoiceCurrency(previewDoc.totals.discountTotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatInvoiceCurrency(previewDoc.totals.taxTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Round off</span>
            <span>{formatInvoiceCurrency(previewDoc.totals.roundOff)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
            <span>Total</span>
            <span>{currency(previewDoc.totals.grandTotal)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {canSaveDraft ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void saveDraft()}
            >
              Save as Draft
            </Button>
          ) : null}
          {canIssue ? (
            <Button
              type="submit"
              disabled={busy}
              className="bg-[#2F6BFF] hover:bg-[#2558d9]"
            >
              {busy ? "Working…" : "Save & Issue"}
            </Button>
          ) : null}
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
