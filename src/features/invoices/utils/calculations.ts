import type {
  InvoiceLineComputed,
  InvoiceLineInput,
  InvoiceTotals,
  TaxMode,
} from "@/features/invoices/types/invoice.types";

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeLine(line: InvoiceLineInput): InvoiceLineComputed {
  const quantity = Math.max(0, Number(line.quantity) || 0);
  const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
  const discountPercent = Math.max(
    0,
    Math.min(100, Number(line.discountPercent) || 0),
  );
  const taxRatePercent = Math.max(0, Number(line.taxRatePercent) || 0);
  const lineSubtotal = round2(quantity * unitPrice);
  const discountAmount = round2(lineSubtotal * (discountPercent / 100));
  const taxableAmount = round2(lineSubtotal - discountAmount);
  const taxAmount = round2(taxableAmount * (taxRatePercent / 100));
  const lineTotal = round2(taxableAmount + taxAmount);
  return {
    ...line,
    quantity,
    unitPrice,
    discountPercent,
    taxRatePercent,
    lineSubtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    lineTotal,
  };
}

export function computeLines(lines: InvoiceLineInput[]): InvoiceLineComputed[] {
  return lines.map(computeLine);
}

export function resolveTaxMode(
  supplierState?: string,
  placeOfSupply?: string,
): TaxMode {
  if (!supplierState || !placeOfSupply) return "cgst_sgst";
  const a = supplierState.trim().toLowerCase();
  const b = placeOfSupply.trim().toLowerCase();
  if (!a || !b) return "cgst_sgst";
  return a === b ? "cgst_sgst" : "igst";
}

export function computeTotals(
  lines: InvoiceLineComputed[],
  taxMode: TaxMode,
  amountPaid = 0,
): InvoiceTotals {
  const subtotal = round2(
    lines.reduce((sum, line) => sum + line.lineSubtotal, 0),
  );
  const discountTotal = round2(
    lines.reduce((sum, line) => sum + line.discountAmount, 0),
  );
  const taxableTotal = round2(
    lines.reduce((sum, line) => sum + line.taxableAmount, 0),
  );
  const taxTotal = round2(lines.reduce((sum, line) => sum + line.taxAmount, 0));

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (taxMode === "igst") {
    igst = taxTotal;
  } else if (taxMode === "cgst_sgst") {
    cgst = round2(taxTotal / 2);
    sgst = round2(taxTotal - cgst);
  }

  const rawGrand = round2(taxableTotal + taxTotal);
  const grandTotal = Math.round(rawGrand);
  const roundOff = round2(grandTotal - rawGrand);
  const paid = Math.max(0, round2(amountPaid));
  const balanceDue = round2(Math.max(0, grandTotal - paid));

  return {
    subtotal,
    discountTotal,
    taxableTotal,
    cgst,
    sgst,
    igst,
    taxTotal,
    roundOff,
    grandTotal,
    amountPaid: paid,
    balanceDue,
  };
}

export function validateInvoiceLines(lines: InvoiceLineInput[]): string[] {
  const errors: string[] = [];
  if (lines.length === 0) errors.push("Add at least one line item.");
  lines.forEach((line, index) => {
    if (!line.name.trim()) errors.push(`Line ${index + 1}: name is required.`);
    if (!(line.quantity > 0))
      errors.push(`Line ${index + 1}: quantity must be greater than 0.`);
    if (line.unitPrice < 0)
      errors.push(`Line ${index + 1}: unit price cannot be negative.`);
  });
  return errors;
}
