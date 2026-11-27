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
import { FormField, currency } from "@/features/crm/shared";
import {
  getCustomerById,
  loadCustomers,
  listProducts,
  upsertQuotation,
} from "@/features/erp/demoStore";
import type { Product, Quotation, QuotationLine } from "@/features/erp/types";
import {
  computeLines,
  computeTotals,
  validateInvoiceLines,
} from "@/features/invoices/utils/calculations";

function emptyLine(id: string): QuotationLine {
  return {
    id,
    name: "",
    quantity: 1,
    unit: "service",
    unitPrice: 0,
    discountPercent: 0,
    taxRatePercent: 18,
  };
}

function applyProduct(line: QuotationLine, product: Product): QuotationLine {
  return {
    ...line,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    hsnSac: product.hsnSac,
    unit: product.unit,
    unitPrice: product.sellingPrice,
    taxRatePercent: product.gstRate,
  };
}

function nextQuoteNumber() {
  return `QT-2026-${String(Date.now()).slice(-4)}`;
}

export function QuotationForm({
  editing,
  onCancel,
  onSaved,
}: {
  editing?: Quotation | null;
  onCancel: () => void;
  onSaved: (quotation: Quotation) => void;
}) {
  const customers = loadCustomers();
  const products = listProducts();
  const [customerId, setCustomerId] = useState(
    editing?.customerId ?? customers[0]?.id ?? "",
  );
  const [number, setNumber] = useState(editing?.number ?? nextQuoteNumber());
  const [quoteDate, setQuoteDate] = useState(
    editing?.quoteDate ?? "2026-12-27",
  );
  const [validUntil, setValidUntil] = useState(
    editing?.validUntil ?? "2027-01-27",
  );
  const [status, setStatus] = useState<Quotation["status"]>(
    editing?.status ?? "Draft",
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [lines, setLines] = useState<QuotationLine[]>(
    editing?.lines?.length
      ? editing.lines.map((line) => ({ ...line }))
      : [emptyLine("ql-1")],
  );

  const customer = getCustomerById(customerId) ?? customers[0]!;
  const totals = useMemo(() => {
    const computed = computeLines(
      lines.map((line) => ({
        id: line.id,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        ...(line.hsnSac ? { hsnSac: line.hsnSac } : {}),
        ...(line.unit ? { unit: line.unit } : {}),
        ...(line.discountPercent != null
          ? { discountPercent: line.discountPercent }
          : {}),
        ...(line.taxRatePercent != null
          ? { taxRatePercent: line.taxRatePercent }
          : {}),
      })),
    );
    return computeTotals(computed, "cgst_sgst", 0);
  }, [lines]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateInvoiceLines(
      lines.map((line) => ({
        id: line.id,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        ...(line.discountPercent != null
          ? { discountPercent: line.discountPercent }
          : {}),
        ...(line.taxRatePercent != null
          ? { taxRatePercent: line.taxRatePercent }
          : {}),
      })),
    );
    if (errors.length) {
      notify.warning(errors[0]!);
      return;
    }
    if (editing?.status === "Converted") {
      notify.warning("Converted quotations cannot be edited.");
      return;
    }
    const quotation: Quotation = {
      id: editing?.id ?? `q-${Date.now()}`,
      number,
      customerId,
      customerName: customer.name,
      company: customer.company,
      quoteDate,
      validUntil,
      status,
      lines,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      ...(notes ? { notes } : {}),
      ...(editing?.convertedInvoiceId
        ? { convertedInvoiceId: editing.convertedInvoiceId }
        : {}),
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertQuotation(quotation);
    onSaved(quotation);
    recordAndToast({
      module: "quotations",
      eventType: editing ? "quotation.updated" : "quotation.created",
      title: editing ? "Quotation updated" : "Quotation created",
      description: `${quotation.number} · ${quotation.company}`,
      severity: "success",
      operationStatus: "succeeded",
      relatedRecordId: quotation.id,
      relatedRoute: "/quotations",
      idempotencyKey: `quotation-${quotation.id}-${quotation.updatedAt}`,
    });
  };

  const updateLine = (id: string, patch: Partial<QuotationLine>) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>
          {editing ? "Edit quotation" : "Create quotation"}
        </DialogTitle>
        <DialogDescription>
          Reuse invoice calculation rules. Convert accepted quotes to invoices
          once.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Customer" required>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customers.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Quote number" required>
            <Input
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Quote date" required>
            <Input
              type="date"
              value={quoteDate}
              onChange={(event) => setQuoteDate(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Valid until" required>
            <Input
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
              required
            />
          </FormField>
        </div>
        <FormField label="Status">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as Quotation["status"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                ["Draft", "Sent", "Accepted", "Rejected", "Expired"] as const
              ).map((item) => (
                <SelectItem
                  key={item}
                  value={item}
                  disabled={editing?.status === "Converted"}
                >
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="space-y-2 rounded-md border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
            <p className="text-xs font-semibold">Products & services</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setLines((current) => [
                  ...current,
                  emptyLine(`ql-${Date.now()}`),
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          </div>
          <div className="hidden gap-2 border-b border-border bg-muted/30 px-3 py-2 text-[11px] font-semibold text-muted-foreground sm:grid sm:grid-cols-[1.2fr_1fr_70px_100px_70px_70px_auto]">
            <span>Product / Service</span>
            <span>Item name</span>
            <span>Quantity</span>
            <span>Unit Price (₹)</span>
            <span>Discount %</span>
            <span>GST %</span>
            <span className="text-right">Actions</span>
          </div>
          {lines.map((line) => (
            <div
              key={line.id}
              className="grid gap-2 border-b border-border p-3 last:border-b-0 sm:grid-cols-[1.2fr_1fr_70px_100px_70px_70px_auto]"
            >
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
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
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
                  placeholder="Name"
                  aria-label="Item name"
                  required
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
                  value={line.taxRatePercent ?? 0}
                  onChange={(event) =>
                    updateLine(line.id, {
                      taxRatePercent: Number(event.target.value) || 0,
                    })
                  }
                  aria-label="GST %"
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
          ))}
        </div>

        <FormField label="Notes">
          <Textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </FormField>
        <div className="ml-auto grid w-full max-w-xs gap-1 rounded-md bg-muted/50 p-3 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{currency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{currency(totals.taxTotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{currency(totals.grandTotal)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save quotation</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
