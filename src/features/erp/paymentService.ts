import {
  addPayment,
  listInvoiceIndex,
  listPayments,
  recomputeCustomerOutstanding,
  upsertInvoiceIndex,
} from "@/features/erp/demoStore";
import type { PaymentRecord } from "@/features/erp/types";
import {
  getInvoiceSnapshot,
  saveInvoiceSnapshot,
} from "@/features/invoices/services/snapshotStore";
import type { InvoiceDocumentModel } from "@/features/invoices/types/invoice.types";
import { computeTotals } from "@/features/invoices/utils/calculations";

export function listPaymentsForInvoice(invoiceId: string) {
  return listPayments().filter((payment) => payment.invoiceId === invoiceId);
}

export function recordInvoicePayment(input: {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  method: string;
  reference: string;
  paidAt?: string;
  idempotencyKey?: string;
}): { payment: PaymentRecord; document: InvoiceDocumentModel | null } {
  const amount = Math.round((Number(input.amount) || 0) * 100) / 100;
  if (!(amount > 0))
    throw new Error("Payment amount must be greater than zero.");

  const idempotencyKey =
    input.idempotencyKey ??
    `pay:${input.invoiceId}:${input.reference || amount}:${input.paidAt ?? ""}`;

  const existing = listPayments().find(
    (payment) => payment.idempotencyKey === idempotencyKey,
  );
  if (existing) {
    const snapshot = getInvoiceSnapshot(input.invoiceId);
    return { payment: existing, document: snapshot?.document ?? null };
  }

  const snapshot = getInvoiceSnapshot(input.invoiceId);
  let balanceDue = 0;
  let document: InvoiceDocumentModel | null = null;

  if (snapshot?.document) {
    balanceDue = snapshot.document.totals.balanceDue;
    if (amount > balanceDue + 0.001) {
      throw new Error(`Payment exceeds outstanding balance of ${balanceDue}.`);
    }
    const amountPaid =
      Math.round((snapshot.document.totals.amountPaid + amount) * 100) / 100;
    const totals = computeTotals(
      snapshot.document.lines,
      snapshot.document.taxMode,
      amountPaid,
    );
    const status: InvoiceDocumentModel["status"] =
      totals.balanceDue === 0
        ? "Paid"
        : totals.amountPaid > 0
          ? "Partially Paid"
          : snapshot.document.status;
    document = {
      ...snapshot.document,
      status,
      paymentMethod: input.method,
      totals,
      updatedAt: new Date().toISOString(),
    };
    saveInvoiceSnapshot(document);
    upsertInvoiceIndex({
      id: document.id,
      number: document.number,
      customer: document.customer.company || document.customer.name,
      invoiceDate: document.invoiceDate,
      dueDate: document.dueDate,
      total: document.totals.grandTotal,
      balance: document.totals.balanceDue,
      status:
        status === "Issued"
          ? "Pending"
          : status === "Partially Paid"
            ? "Pending"
            : status,
    });
  } else {
    const row = listInvoiceIndex().find(
      (invoice) => invoice.id === input.invoiceId,
    );
    if (!row) throw new Error("Invoice not found.");
    if (amount > row.balance + 0.001)
      throw new Error(`Payment exceeds outstanding balance of ${row.balance}.`);
    const nextBalance = Math.round((row.balance - amount) * 100) / 100;
    upsertInvoiceIndex({
      ...row,
      balance: nextBalance,
      status: nextBalance === 0 ? "Paid" : "Pending",
    });
  }

  const payment: PaymentRecord = {
    id: `pay-${Date.now()}`,
    invoiceId: input.invoiceId,
    invoiceNumber: input.invoiceNumber,
    customerName: input.customerName,
    amount,
    method: input.method,
    reference: input.reference || `TXN-${Date.now()}`,
    paidAt: input.paidAt ?? new Date().toISOString().slice(0, 10),
    idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  addPayment(payment);
  recomputeCustomerOutstanding();
  return { payment, document };
}
