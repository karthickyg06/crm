import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "@/features/invoices/utils/invoiceFormatter";

export type TemplateTheme = {
  accent: string;
  headerBg?: string;
  headerText?: string;
  border: string;
  muted: string;
  text: string;
  tableHeaderBg: string;
  mono?: boolean;
};

export const defaultVisibility: InvoiceFieldVisibility = {
  logo: true,
  shippingAddress: true,
  customerGstin: true,
  hsnSac: true,
  bankDetails: true,
  paymentQr: true,
  terms: true,
  signature: true,
};

export function pageSizeFor(paper: PaperFormat) {
  if (paper === "A4") return "A4" as const;
  if (paper === "A5") return "A5" as const;
  if (paper === "T80") return { width: 226.77, height: 841.89 } as const;
  return { width: 164.41, height: 841.89 } as const;
}

export function createBaseStyles(theme: TemplateTheme, compact = false) {
  const pad = compact ? 18 : 28;
  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: compact ? 8.5 : 10,
      color: theme.text,
      paddingTop: pad,
      paddingBottom: pad + 16,
      paddingHorizontal: pad,
      backgroundColor: "#ffffff",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: compact ? 10 : 16,
      gap: 12,
    },
    companyName: {
      fontSize: compact ? 13 : 16,
      fontFamily: "Helvetica-Bold",
      color: theme.accent,
      marginBottom: 4,
    },
    muted: {
      color: theme.muted,
      fontSize: compact ? 7.5 : 8.5,
      lineHeight: 1.4,
    },
    title: {
      fontSize: compact ? 14 : 18,
      fontFamily: "Helvetica-Bold",
      color: theme.headerText ?? theme.text,
      textAlign: "right",
    },
    sectionTitle: {
      fontSize: compact ? 8 : 9,
      fontFamily: "Helvetica-Bold",
      marginBottom: 4,
      color: theme.accent,
      textTransform: "uppercase",
    },
    twoCol: { flexDirection: "row", gap: 14, marginBottom: compact ? 10 : 14 },
    col: { flex: 1 },
    metaBox: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      padding: compact ? 6 : 8,
      minWidth: compact ? 120 : 160,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    metaLabel: { color: theme.muted, fontSize: compact ? 7 : 8 },
    metaValue: { fontFamily: "Helvetica-Bold", fontSize: compact ? 7.5 : 8.5 },
    table: { marginTop: 4, marginBottom: compact ? 8 : 12 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: theme.tableHeaderBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: compact ? 4 : 6,
      paddingHorizontal: 4,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: compact ? 4 : 6,
      paddingHorizontal: 4,
    },
    th: {
      fontFamily: "Helvetica-Bold",
      fontSize: compact ? 7 : 8,
      color: theme.text,
    },
    td: { fontSize: compact ? 7 : 8.5, color: theme.text },
    right: { textAlign: "right" },
    totalsBox: {
      marginLeft: "auto",
      width: compact ? 150 : 190,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      padding: compact ? 6 : 8,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    grandRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 5,
      marginTop: 3,
    },
    grandLabel: { fontFamily: "Helvetica-Bold", fontSize: compact ? 8 : 10 },
    grandValue: {
      fontFamily: "Helvetica-Bold",
      fontSize: compact ? 8 : 10,
      color: theme.accent,
    },
    footer: {
      position: "absolute",
      left: pad,
      right: pad,
      bottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      color: theme.muted,
      fontSize: 7.5,
    },
    banner: {
      backgroundColor: theme.headerBg ?? theme.accent,
      color: theme.headerText ?? "#fff",
      padding: compact ? 8 : 12,
      marginBottom: compact ? 10 : 14,
      borderRadius: 4,
    },
  });
}

function hideEmpty(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return false;
  return true;
}

export function InvoicePdfShell({
  document: doc,
  paper,
  theme,
  visibility = defaultVisibility,
  compact = false,
  children,
}: {
  document: InvoiceDocumentModel;
  paper: PaperFormat;
  theme: TemplateTheme;
  visibility?: InvoiceFieldVisibility | undefined;
  compact?: boolean | undefined;
  children?: ReactNode;
}) {
  const styles = createBaseStyles(theme, compact);
  const size = pageSizeFor(paper);
  return (
    <Document
      title={`${doc.number} — ${doc.customer.name || doc.customer.company || "Invoice"}`}
    >
      <Page size={size} style={styles.page} wrap>
        {children}
        <View style={styles.footer} fixed>
          <Text>{doc.company.footerMessage || doc.company.name}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export function StandardInvoiceBody({
  document: doc,
  theme,
  visibility = defaultVisibility,
  compact = false,
  showBanner = false,
  bannerTitle = "TAX INVOICE",
}: {
  document: InvoiceDocumentModel;
  theme: TemplateTheme;
  visibility?: InvoiceFieldVisibility | undefined;
  compact?: boolean | undefined;
  showBanner?: boolean | undefined;
  bannerTitle?: string | undefined;
}) {
  const styles = createBaseStyles(theme, compact);
  const showHsn =
    visibility.hsnSac && doc.lines.some((line) => hideEmpty(line.hsnSac));

  return (
    <>
      {showBanner ? (
        <View style={styles.banner}>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: compact ? 12 : 14,
            }}
          >
            {bannerTitle}
          </Text>
          <Text style={{ marginTop: 2, fontSize: compact ? 8 : 9 }}>
            {doc.number}
          </Text>
        </View>
      ) : null}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {visibility.logo && doc.company.logoUrl ? (
            <Image
              src={doc.company.logoUrl}
              style={{ width: 64, height: 32, marginBottom: 6 }}
            />
          ) : null}
          <Text style={styles.companyName}>{doc.company.name}</Text>
          <Text style={styles.muted}>{doc.company.address}</Text>
          {hideEmpty(doc.company.gstin) ? (
            <Text style={styles.muted}>GSTIN: {doc.company.gstin}</Text>
          ) : null}
          {hideEmpty(doc.company.phone) ? (
            <Text style={styles.muted}>Phone: {doc.company.phone}</Text>
          ) : null}
          {hideEmpty(doc.company.email) ? (
            <Text style={styles.muted}>Email: {doc.company.email}</Text>
          ) : null}
        </View>
        <View style={styles.metaBox}>
          {!showBanner ? <Text style={styles.title}>INVOICE</Text> : null}
          <View style={[styles.metaRow, { marginTop: showBanner ? 0 : 8 }]}>
            <Text style={styles.metaLabel}>Invoice No.</Text>
            <Text style={styles.metaValue}>{doc.number}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice Date</Text>
            <Text style={styles.metaValue}>
              {formatInvoiceDate(doc.invoiceDate)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>
              {formatInvoiceDate(doc.dueDate)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{doc.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
            {doc.customer.company || doc.customer.name}
          </Text>
          {doc.customer.company && doc.customer.name ? (
            <Text style={styles.muted}>{doc.customer.name}</Text>
          ) : null}
          {hideEmpty(doc.customer.billingAddress) ? (
            <Text style={styles.muted}>{doc.customer.billingAddress}</Text>
          ) : null}
          {visibility.customerGstin && hideEmpty(doc.customer.gstin) ? (
            <Text style={styles.muted}>GSTIN: {doc.customer.gstin}</Text>
          ) : null}
          {hideEmpty(doc.customer.placeOfSupply) ? (
            <Text style={styles.muted}>
              Place of supply: {doc.customer.placeOfSupply}
            </Text>
          ) : null}
          {hideEmpty(doc.customer.phone) ? (
            <Text style={styles.muted}>{doc.customer.phone}</Text>
          ) : null}
          {hideEmpty(doc.customer.email) ? (
            <Text style={styles.muted}>{doc.customer.email}</Text>
          ) : null}
        </View>
        {visibility.shippingAddress &&
        hideEmpty(doc.customer.shippingAddress) ? (
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Ship To</Text>
            <Text style={styles.muted}>{doc.customer.shippingAddress}</Text>
          </View>
        ) : (
          <View style={styles.col} />
        )}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.th, { width: showHsn ? "28%" : "36%" }]}>
            Item
          </Text>
          {showHsn ? (
            <Text style={[styles.th, { width: "12%" }]}>HSN/SAC</Text>
          ) : null}
          <Text style={[styles.th, styles.right, { width: "10%" }]}>Qty</Text>
          <Text style={[styles.th, styles.right, { width: "14%" }]}>Rate</Text>
          <Text style={[styles.th, styles.right, { width: "12%" }]}>Disc.</Text>
          <Text style={[styles.th, styles.right, { width: "12%" }]}>Tax</Text>
          <Text style={[styles.th, styles.right, { width: "14%" }]}>
            Amount
          </Text>
        </View>
        {doc.lines.map((line) => (
          <View style={styles.tableRow} key={line.id} wrap={false}>
            <View style={{ width: showHsn ? "28%" : "36%" }}>
              <Text style={styles.td}>{line.name}</Text>
              {hideEmpty(line.unit) ? (
                <Text style={styles.muted}>{line.unit}</Text>
              ) : null}
            </View>
            {showHsn ? (
              <Text style={[styles.td, { width: "12%" }]}>
                {line.hsnSac || "—"}
              </Text>
            ) : null}
            <Text style={[styles.td, styles.right, { width: "10%" }]}>
              {line.quantity}
            </Text>
            <Text style={[styles.td, styles.right, { width: "14%" }]}>
              {formatInvoiceCurrency(line.unitPrice)}
            </Text>
            <Text style={[styles.td, styles.right, { width: "12%" }]}>
              {line.discountPercent ? `${line.discountPercent}%` : "—"}
            </Text>
            <Text style={[styles.td, styles.right, { width: "12%" }]}>
              {line.taxRatePercent ? `${line.taxRatePercent}%` : "—"}
            </Text>
            <Text style={[styles.td, styles.right, { width: "14%" }]}>
              {formatInvoiceCurrency(line.lineTotal)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 8 }}>
          {visibility.bankDetails &&
          (doc.company.bankName || doc.company.bankAccount) ? (
            <View>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              {hideEmpty(doc.company.bankName) ? (
                <Text style={styles.muted}>{doc.company.bankName}</Text>
              ) : null}
              {hideEmpty(doc.company.bankAccount) ? (
                <Text style={styles.muted}>A/C: {doc.company.bankAccount}</Text>
              ) : null}
              {hideEmpty(doc.company.bankIfsc) ? (
                <Text style={styles.muted}>IFSC: {doc.company.bankIfsc}</Text>
              ) : null}
              {hideEmpty(doc.paymentMethod) ? (
                <Text style={styles.muted}>Method: {doc.paymentMethod}</Text>
              ) : null}
            </View>
          ) : null}
          {visibility.paymentQr && doc.paymentQrDataUrl ? (
            <View>
              <Text style={styles.sectionTitle}>Pay via UPI</Text>
              <Image
                src={doc.paymentQrDataUrl}
                style={{ width: 72, height: 72 }}
              />
            </View>
          ) : null}
          {visibility.terms && hideEmpty(doc.company.terms) ? (
            <View>
              <Text style={styles.sectionTitle}>Terms</Text>
              <Text style={styles.muted}>{doc.company.terms}</Text>
            </View>
          ) : null}
          {hideEmpty(doc.notes) ? (
            <View>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.muted}>{doc.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.metaLabel}>Subtotal</Text>
            <Text>{formatInvoiceCurrency(doc.totals.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.metaLabel}>Discount</Text>
            <Text>-{formatInvoiceCurrency(doc.totals.discountTotal)}</Text>
          </View>
          {doc.taxMode === "igst" ? (
            <View style={styles.totalRow}>
              <Text style={styles.metaLabel}>IGST</Text>
              <Text>{formatInvoiceCurrency(doc.totals.igst)}</Text>
            </View>
          ) : doc.taxMode === "cgst_sgst" ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.metaLabel}>CGST</Text>
                <Text>{formatInvoiceCurrency(doc.totals.cgst)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.metaLabel}>SGST</Text>
                <Text>{formatInvoiceCurrency(doc.totals.sgst)}</Text>
              </View>
            </>
          ) : null}
          {doc.totals.roundOff !== 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.metaLabel}>Round off</Text>
              <Text>{formatInvoiceCurrency(doc.totals.roundOff)}</Text>
            </View>
          ) : null}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>
              {formatInvoiceCurrency(doc.totals.grandTotal)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.metaLabel}>Amount Paid</Text>
            <Text>{formatInvoiceCurrency(doc.totals.amountPaid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.metaLabel}>Balance Due</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              {formatInvoiceCurrency(doc.totals.balanceDue)}
            </Text>
          </View>
        </View>
      </View>

      {visibility.signature ? (
        <View style={{ marginTop: compact ? 18 : 28, alignItems: "flex-end" }}>
          <View
            style={{
              width: 140,
              borderTopWidth: 1,
              borderTopColor: theme.border,
              paddingTop: 6,
            }}
          >
            <Text
              style={{ textAlign: "center", fontSize: compact ? 7.5 : 8.5 }}
            >
              {doc.company.signatureLabel || "Authorized Signatory"}
            </Text>
          </View>
        </View>
      ) : null}
    </>
  );
}

export function ThermalInvoiceBody({
  document: doc,
  widthLabel,
}: {
  document: InvoiceDocumentModel;
  widthLabel: string;
}) {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 8,
      color: "#000",
      paddingTop: 10,
      paddingBottom: 12,
      paddingHorizontal: 8,
    },
    center: { textAlign: "center" },
    bold: { fontFamily: "Helvetica-Bold" },
    line: {
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      borderStyle: "dashed",
      marginVertical: 6,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    itemName: { width: "52%" },
    qty: { width: "12%", textAlign: "right" },
    price: { width: "18%", textAlign: "right" },
    amt: { width: "18%", textAlign: "right" },
  });

  return (
    <Document title={`${doc.number} receipt`}>
      <Page
        size={
          widthLabel === "80mm"
            ? { width: 226.77, height: 841.89 }
            : { width: 164.41, height: 841.89 }
        }
        style={styles.page}
      >
        <Text style={[styles.center, styles.bold, { fontSize: 11 }]}>
          {doc.company.name}
        </Text>
        <Text style={[styles.center, { marginTop: 2 }]}>
          {doc.company.address}
        </Text>
        {doc.company.gstin ? (
          <Text style={styles.center}>GSTIN: {doc.company.gstin}</Text>
        ) : null}
        <Text style={[styles.center, { marginTop: 2 }]}>
          {widthLabel} Receipt
        </Text>
        <View style={styles.line} />
        <View style={styles.row}>
          <Text>Invoice</Text>
          <Text style={styles.bold}>{doc.number}</Text>
        </View>
        <View style={styles.row}>
          <Text>Date</Text>
          <Text>{formatInvoiceDate(doc.invoiceDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Customer</Text>
          <Text>{doc.customer.company || doc.customer.name}</Text>
        </View>
        <View style={styles.line} />
        <View style={[styles.row, styles.bold]}>
          <Text style={styles.itemName}>Item</Text>
          <Text style={styles.qty}>Qty</Text>
          <Text style={styles.price}>Rate</Text>
          <Text style={styles.amt}>Amt</Text>
        </View>
        {doc.lines.map((line) => (
          <View key={line.id} style={{ marginBottom: 4 }}>
            <Text style={styles.itemName}>{line.name}</Text>
            <View style={styles.row}>
              <Text style={styles.itemName} />
              <Text style={styles.qty}>{line.quantity}</Text>
              <Text style={styles.price}>
                {formatInvoiceCurrency(line.unitPrice, false)}
              </Text>
              <Text style={styles.amt}>
                {formatInvoiceCurrency(line.lineTotal, false)}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.line} />
        <View style={styles.row}>
          <Text>Subtotal</Text>
          <Text>{formatInvoiceCurrency(doc.totals.subtotal, false)}</Text>
        </View>
        {doc.totals.discountTotal > 0 ? (
          <View style={styles.row}>
            <Text>Discount</Text>
            <Text>
              -{formatInvoiceCurrency(doc.totals.discountTotal, false)}
            </Text>
          </View>
        ) : null}
        {doc.taxMode === "igst" ? (
          <View style={styles.row}>
            <Text>IGST</Text>
            <Text>{formatInvoiceCurrency(doc.totals.igst, false)}</Text>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <Text>CGST</Text>
              <Text>{formatInvoiceCurrency(doc.totals.cgst, false)}</Text>
            </View>
            <View style={styles.row}>
              <Text>SGST</Text>
              <Text>{formatInvoiceCurrency(doc.totals.sgst, false)}</Text>
            </View>
          </>
        )}
        <View style={[styles.row, styles.bold, { marginTop: 4 }]}>
          <Text>TOTAL</Text>
          <Text>{formatInvoiceCurrency(doc.totals.grandTotal, false)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Paid</Text>
          <Text>{formatInvoiceCurrency(doc.totals.amountPaid, false)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Balance</Text>
          <Text>{formatInvoiceCurrency(doc.totals.balanceDue, false)}</Text>
        </View>
        {doc.paymentMethod ? (
          <View style={styles.row}>
            <Text>Pay</Text>
            <Text>{doc.paymentMethod}</Text>
          </View>
        ) : null}
        {doc.paymentQrDataUrl ? (
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Image
              src={doc.paymentQrDataUrl}
              style={{ width: 64, height: 64 }}
            />
          </View>
        ) : null}
        <View style={styles.line} />
        <Text style={[styles.center, { marginTop: 4 }]}>
          {doc.company.footerMessage || "Thank you!"}
        </Text>
      </Page>
    </Document>
  );
}
