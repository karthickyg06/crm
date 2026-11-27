import { useMemo, useState } from "react";
import { Download, LineChart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AppShell,
  FormField,
  MetricCard,
  MetricGrid,
  PageHeader,
  currency,
} from "@/features/crm/shared";
import { useAuth } from "@/features/auth/useAuth";
import {
  listInvoiceIndex,
  listPayments,
  listProducts,
  loadCustomers,
} from "@/features/erp/demoStore";
import {
  computeGstSummary,
  computeInvoiceSummary,
  toCsv,
} from "@/features/erp/selectors";

function downloadCsv(
  filename: string,
  rows: Array<Record<string, string | number>>,
) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${filename}`);
}

export function ReportsPage() {
  const { can } = useAuth();
  const canExport = can("reports", "export");
  const showSales = can("invoices", "view");
  const showPayments = can("payments", "view");
  const showCustomers = can("customers", "view");
  const showStock = can("inventory", "view") || can("products", "view");
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-12-31");

  const invoices = showSales ? listInvoiceIndex() : [];
  const payments = showPayments ? listPayments() : [];
  const customers = showCustomers ? loadCustomers() : [];
  const products = showStock ? listProducts() : [];
  const summary = computeInvoiceSummary(invoices);
  const gst = useMemo(
    () => (showSales ? computeGstSummary(from, to) : []),
    [from, to, showSales],
  );

  const inRange = (date: string) => {
    const time = Date.parse(date);
    if (Number.isNaN(time)) return true;
    return time >= Date.parse(from) && time <= Date.parse(to);
  };

  const salesRows = invoices
    .filter(
      (invoice) => invoice.status !== "Draft" && inRange(invoice.invoiceDate),
    )
    .map((invoice) => ({
      number: invoice.number,
      customer: invoice.customer,
      date: invoice.invoiceDate,
      total: invoice.total,
      balance: invoice.balance,
      status: invoice.status,
    }));

  const paymentRows = payments
    .filter((payment) => inRange(payment.paidAt))
    .map((payment) => ({
      invoice: payment.invoiceNumber,
      customer: payment.customerName,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      date: payment.paidAt,
    }));

  const outstandingRows = invoices
    .filter((invoice) => invoice.balance > 0 && invoice.status !== "Draft")
    .map((invoice) => ({
      number: invoice.number,
      customer: invoice.customer,
      total: invoice.total,
      balance: invoice.balance,
      status: invoice.status,
    }));

  const balanceRows = customers.map((customer) => ({
    customer: customer.company,
    outstanding: customer.outstanding,
    business: customer.business,
    status: customer.status,
  }));

  const stockRows = products
    .filter((product) => product.kind === "product")
    .map((product) => ({
      sku: product.sku,
      name: product.name,
      stock: product.stockQty,
      lowAt: product.lowStockAt,
      value: product.stockQty * product.sellingPrice,
    }));

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Sales, payments, outstanding balances, stock, and GST summaries from live demo data."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="From">
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </FormField>
        <FormField label="To">
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </FormField>
      </div>
      <MetricGrid>
        {showSales ? (
          <MetricCard
            icon={<LineChart className="h-4 w-4" />}
            label="Sales (issued)"
            value={currency(summary.total)}
            change="0%"
          />
        ) : null}
        {showPayments ? (
          <MetricCard
            icon={<LineChart className="h-4 w-4" />}
            label="Payments"
            value={currency(payments.reduce((sum, p) => sum + p.amount, 0))}
            change="0%"
          />
        ) : null}
        {showSales ? (
          <MetricCard
            icon={<LineChart className="h-4 w-4" />}
            label="Outstanding"
            value={currency(summary.pending.amount + summary.overdue.amount)}
            change="0%"
          />
        ) : null}
        {showSales ? (
          <MetricCard
            icon={<LineChart className="h-4 w-4" />}
            label="GST lines"
            value={String(gst.length)}
            change="0%"
          />
        ) : null}
      </MetricGrid>

      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        {(
          [
            showSales
              ? {
                  title: "Sales report",
                  rows: salesRows as Array<Record<string, string | number>>,
                  file: "sales-report.csv",
                }
              : null,
            showPayments
              ? {
                  title: "Payment report",
                  rows: paymentRows as Array<Record<string, string | number>>,
                  file: "payment-report.csv",
                }
              : null,
            showSales
              ? {
                  title: "Outstanding invoices",
                  rows: outstandingRows as Array<
                    Record<string, string | number>
                  >,
                  file: "outstanding-invoices.csv",
                }
              : null,
            showCustomers
              ? {
                  title: "Customer balances",
                  rows: balanceRows as Array<Record<string, string | number>>,
                  file: "customer-balances.csv",
                }
              : null,
            showStock
              ? {
                  title: "Stock report",
                  rows: stockRows as Array<Record<string, string | number>>,
                  file: "stock-report.csv",
                }
              : null,
            showSales
              ? {
                  title: "GST summary",
                  rows: gst.map((row) => ({
                    invoice: row.invoiceNumber,
                    customer: row.customer,
                    taxable: row.taxable,
                    cgst: row.cgst,
                    sgst: row.sgst,
                    total: row.total,
                  })) as Array<Record<string, string | number>>,
                  file: "gst-summary.csv",
                }
              : null,
          ] as Array<{
            title: string;
            rows: Array<Record<string, string | number>>;
            file: string;
          } | null>
        )
          .filter(
            (
              report,
            ): report is {
              title: string;
              rows: Array<Record<string, string | number>>;
              file: string;
            } => report !== null,
          )
          .map((report) => (
            <article key={report.title} className="crm-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">{report.title}</h2>
                {canExport ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadCsv(report.file, report.rows)}
                  >
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {report.rows.length} rows in selected range / current ledger.
              </p>
              <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-xs">
                {report.rows.slice(0, 6).map((row, index) => (
                  <li
                    key={`${report.title}-${index}`}
                    className="flex justify-between gap-2 border-b border-border/60 py-1"
                  >
                    <span className="truncate">{Object.values(row)[0]}</span>
                    <span className="tabular-nums">
                      {Object.values(row)[Object.values(row).length - 2]}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
      </div>
    </AppShell>
  );
}
