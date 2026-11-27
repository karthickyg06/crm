import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";

import type { PaymentRecord } from "@/features/erp/types";
import { listInvoiceIndex } from "@/features/erp/demoStore";
import { PaymentReceiptDocument } from "@/features/invoices/templates/PaymentReceipt";
import { loadOrgInvoicePreferences } from "@/features/invoices/services/orgPrefsStore";
import { getInvoiceSnapshot } from "@/features/invoices/services/snapshotStore";
import { printBlob } from "@/features/invoices/services/printService";

export function buildReceiptNumber(payment: PaymentRecord) {
  return `RCP-${payment.id.replace(/^pay-/, "").slice(-8).toUpperCase()}`;
}

export async function renderPaymentReceiptBlob(payment: PaymentRecord) {
  const prefs = loadOrgInvoicePreferences();
  const snapshot = getInvoiceSnapshot(payment.invoiceId);
  const listRow = listInvoiceIndex().find(
    (row) => row.id === payment.invoiceId,
  );
  const invoiceTotal =
    snapshot?.document.totals.grandTotal ?? listRow?.total ?? payment.amount;
  const balanceAfter =
    snapshot?.document.totals.balanceDue ?? listRow?.balance ?? 0;
  const customer = snapshot?.document.customer ?? {
    name: payment.customerName,
    company: payment.customerName,
  };

  const document = createElement(PaymentReceiptDocument, {
    receiptNumber: buildReceiptNumber(payment),
    company: prefs.company,
    customer,
    payment,
    invoiceNumber: payment.invoiceNumber,
    invoiceTotal,
    balanceAfter,
  });

  return pdf(document as never).toBlob();
}

export async function downloadPaymentReceipt(payment: PaymentRecord) {
  const blob = await renderPaymentReceiptBlob(payment);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${buildReceiptNumber(payment)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function printPaymentReceipt(payment: PaymentRecord) {
  const blob = await renderPaymentReceiptBlob(payment);
  await printBlob(blob);
}
