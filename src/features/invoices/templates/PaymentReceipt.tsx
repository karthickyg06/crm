import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { PaymentRecord } from "@/features/erp/types";
import type {
  InvoiceCompany,
  InvoiceCustomerInfo,
} from "@/features/invoices/types/invoice.types";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/invoices/utils/invoiceFormatter";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#2F6BFF",
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#2F6BFF" },
  muted: { color: "#64748b", marginTop: 2 },
  section: { marginBottom: 16 },
  label: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  box: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  amount: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  signature: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 8,
    width: 180,
  },
});

export function PaymentReceiptDocument({
  receiptNumber,
  company,
  customer,
  payment,
  invoiceNumber,
  invoiceTotal,
  balanceAfter,
}: {
  receiptNumber: string;
  company: InvoiceCompany;
  customer: InvoiceCustomerInfo;
  payment: PaymentRecord;
  invoiceNumber: string;
  invoiceTotal: number;
  balanceAfter: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{company.name}</Text>
            <Text style={styles.muted}>{company.address}</Text>
            {company.gstin ? (
              <Text style={styles.muted}>GSTIN: {company.gstin}</Text>
            ) : null}
            {company.phone ? (
              <Text style={styles.muted}>{company.phone}</Text>
            ) : null}
            {company.email ? (
              <Text style={styles.muted}>{company.email}</Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.title}>Payment Receipt</Text>
            <Text style={styles.muted}>{receiptNumber}</Text>
            <Text style={styles.muted}>
              {formatInvoiceDate(payment.paidAt)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Received from</Text>
          <Text>{customer.name}</Text>
          {customer.company ? (
            <Text style={styles.muted}>{customer.company}</Text>
          ) : null}
          {customer.billingAddress ? (
            <Text style={styles.muted}>{customer.billingAddress}</Text>
          ) : null}
          {customer.gstin ? (
            <Text style={styles.muted}>GSTIN: {customer.gstin}</Text>
          ) : null}
        </View>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text>Related invoice</Text>
            <Text>{invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text>Invoice amount</Text>
            <Text>{formatInvoiceCurrency(invoiceTotal)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Payment method</Text>
            <Text>{payment.method}</Text>
          </View>
          <View style={styles.row}>
            <Text>Transaction reference</Text>
            <Text>{payment.reference}</Text>
          </View>
          <View style={styles.row}>
            <Text>Amount received</Text>
            <Text style={styles.amount}>
              {formatInvoiceCurrency(payment.amount)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>Remaining outstanding</Text>
            <Text>{formatInvoiceCurrency(balanceAfter)}</Text>
          </View>
        </View>

        <Text style={styles.muted}>
          This receipt confirms payment against the referenced invoice. It does
          not create a new payment transaction.
        </Text>

        <View style={styles.signature}>
          <Text>{company.signatureLabel || "Authorized Signatory"}</Text>
          <Text style={styles.muted}>{company.name}</Text>
        </View>
      </Page>
    </Document>
  );
}
