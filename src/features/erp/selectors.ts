import {
  listProducts,
  loadCustomers,
  loadDeals,
  loadLeads,
  listInvoiceIndex,
  listPayments,
  loadDemoState,
} from "@/features/erp/demoStore";
import {
  MONTH_SHORT,
  parseFlexibleDate,
} from "@/features/erp/historicalInvoiceSeed";
import { getInvoiceSnapshot } from "@/features/invoices/services/snapshotStore";

export type RevenueGranularity = "month" | "quarter";

export type DashboardMetricsOptions = {
  year?: number;
  granularity?: RevenueGranularity;
  now?: Date;
};

function isDraft(status: string) {
  return status === "Draft";
}

function isCancelledOrVoid(status: string) {
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "void"
  );
}

export function isEligibleSalesInvoice(status: string) {
  return !isDraft(status) && !isCancelledOrVoid(status);
}

function isPaid(status: string) {
  return status === "Paid";
}

function isOverdue(status: string) {
  return status === "Overdue";
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function formatLakhTick(valueInThousands: number) {
  const rupees = valueInThousands * 1000;
  if (rupees >= 100000) {
    const lakhs = rupees / 100000;
    const formatted =
      Math.abs(lakhs) >= 10
        ? Math.round(lakhs).toString()
        : round1(lakhs).toString();
    return `₹${formatted}L`;
  }
  if (rupees >= 1000) {
    return `₹${Math.round(rupees / 1000)}k`;
  }
  return `₹${Math.round(rupees)}`;
}

export function listLedgerYears(now = new Date()) {
  const years = new Set<number>([now.getFullYear()]);
  for (const invoice of listInvoiceIndex()) {
    const date = parseFlexibleDate(invoice.invoiceDate);
    if (date) years.add(date.getFullYear());
  }
  for (const payment of listPayments()) {
    const date = parseFlexibleDate(payment.paidAt);
    if (date) years.add(date.getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function buildRevenueInsightSeries(options: {
  year: number;
  granularity: RevenueGranularity;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  const invoices = listInvoiceIndex().filter((invoice) =>
    isEligibleSalesInvoice(invoice.status),
  );
  const payments = listPayments();

  const salesMap = new Map<number, number>();
  const collectionsMap = new Map<number, number>();

  invoices.forEach((invoice) => {
    const date = parseFlexibleDate(invoice.invoiceDate);
    if (!date || date.getFullYear() !== options.year) return;
    if (date > now) return;
    const bucket =
      options.granularity === "quarter"
        ? Math.floor(date.getMonth() / 3)
        : date.getMonth();
    salesMap.set(bucket, (salesMap.get(bucket) ?? 0) + invoice.total);
  });

  payments.forEach((payment) => {
    const date = parseFlexibleDate(payment.paidAt);
    if (!date || date.getFullYear() !== options.year) return;
    if (date > now) return;
    const bucket =
      options.granularity === "quarter"
        ? Math.floor(date.getMonth() / 3)
        : date.getMonth();
    collectionsMap.set(
      bucket,
      (collectionsMap.get(bucket) ?? 0) + payment.amount,
    );
  });

  const bucketCount = options.granularity === "quarter" ? 4 : 12;
  const maxBucket =
    options.year === now.getFullYear()
      ? options.granularity === "quarter"
        ? Math.floor(now.getMonth() / 3)
        : now.getMonth()
      : bucketCount - 1;

  const series = Array.from({ length: bucketCount }, (_, bucket) => {
    const sales = salesMap.get(bucket) ?? 0;
    const collections = collectionsMap.get(bucket) ?? 0;
    const label =
      options.granularity === "quarter"
        ? `Q${bucket + 1}`
        : MONTH_SHORT[bucket]!;
    // Future buckets in the current year stay explicitly empty.
    const isFuture = options.year === now.getFullYear() && bucket > maxBucket;
    return {
      month: label,
      label,
      sales: isFuture ? 0 : round1(sales / 1000),
      collections: isFuture ? 0 : round1(collections / 1000),
      salesAmount: isFuture ? 0 : sales,
      collectionsAmount: isFuture ? 0 : collections,
    };
  });

  const periodSales = series.reduce((sum, row) => sum + row.salesAmount, 0);
  const periodCollections = series.reduce(
    (sum, row) => sum + row.collectionsAmount,
    0,
  );
  const growthPercent =
    periodSales > 0
      ? Math.min(99, round1((periodCollections / periodSales) * 100))
      : 0;

  return {
    series,
    periodSales,
    periodCollections,
    growthPercent,
    periodLabel:
      options.granularity === "quarter"
        ? `Quarterly · ${options.year}`
        : `Monthly · ${options.year}`,
  };
}

export function computeInvoiceSummary(invoices = listInvoiceIndex()) {
  const active = invoices.filter((invoice) =>
    isEligibleSalesInvoice(invoice.status),
  );
  const paid = active.filter((invoice) => isPaid(invoice.status));
  const overdue = active.filter((invoice) => isOverdue(invoice.status));
  const pending = active.filter(
    (invoice) => !isPaid(invoice.status) && !isOverdue(invoice.status),
  );
  const sum = (rows: typeof active) =>
    rows.reduce((total, row) => total + row.total, 0);
  const balanceSum = (rows: typeof active) =>
    rows.reduce((total, row) => total + row.balance, 0);
  return {
    total: sum(active),
    paid: { amount: sum(paid), count: paid.length },
    pending: { amount: balanceSum(pending), count: pending.length },
    overdue: { amount: balanceSum(overdue), count: overdue.length },
    totals: {
      all: active.length,
      paid: paid.length,
      pending: pending.length,
      overdue: overdue.length,
    },
  };
}

export function computeDashboardMetrics(options: DashboardMetricsOptions = {}) {
  const now = options.now ?? new Date();
  const invoices = listInvoiceIndex();
  const payments = listPayments();
  const customers = loadCustomers();
  const issued = invoices.filter((invoice) =>
    isEligibleSalesInvoice(invoice.status),
  );
  const totalSales = issued.reduce((sum, invoice) => sum + invoice.total, 0);
  const paymentsReceived = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const outstanding = issued.reduce((sum, invoice) => sum + invoice.balance, 0);

  const availableYears = listLedgerYears(now);
  const year = options.year ?? availableYears[0] ?? now.getFullYear();
  const granularity = options.granularity ?? "month";
  const insights = buildRevenueInsightSeries({ year, granularity, now });

  const revenueSeries = insights.series.map((row) => ({
    month: row.month,
    label: row.label,
    sales: row.sales,
    collections: row.collections,
    revenue: row.sales,
  }));

  const recentInvoices = [...issued]
    .sort((a, b) => b.number.localeCompare(a.number))
    .slice(0, 5)
    .map((invoice) => ({
      id: invoice.id,
      orderId: invoice.number,
      date: invoice.invoiceDate,
      customer: invoice.customer,
      category: "Invoice",
      status: invoice.status === "Paid" ? "Completed" : invoice.status,
      items: 1,
      total: invoice.total,
    }));

  const recentPayments = [...payments]
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    .slice(0, 5);

  const growth = insights.growthPercent;

  const leads = loadLeads();
  const deals = loadDeals();
  const products = listProducts();
  const openDeals = deals.filter(
    (deal) => deal.stage !== "Won" && deal.stage !== "Lost",
  );
  const lowStockCount = products.filter(
    (product) =>
      product.kind === "product" && product.stockQty <= product.lowStockAt,
  ).length;

  return {
    totalSales,
    paymentsReceived,
    outstanding,
    invoiceCount: issued.length,
    customerCount: customers.length,
    leadCount: leads.length,
    openDealCount: openDeals.length,
    lowStockCount,
    revenueSeries,
    recentInvoices,
    recentPayments,
    salesGrowth: [
      { name: "growth", value: growth },
      { name: "remaining", value: Math.max(0, 100 - growth) },
    ],
    growthPercent: growth,
    periodSales: insights.periodSales,
    periodCollections: insights.periodCollections,
    periodLabel: insights.periodLabel,
    availableYears,
    selectedYear: year,
    granularity,
  };
}

export function computeGstSummary(from?: string, to?: string) {
  const { invoiceIndex } = loadDemoState();
  return invoiceIndex
    .filter((invoice) => !isDraft(invoice.status))
    .filter((invoice) => {
      if (!from && !to) return true;
      const time = Date.parse(invoice.invoiceDate);
      if (Number.isNaN(time)) return true;
      if (from && time < Date.parse(from)) return false;
      if (to && time > Date.parse(to)) return false;
      return true;
    })
    .map((invoice) => {
      const snapshot = getInvoiceSnapshot(invoice.id);
      if (snapshot?.document.totals) {
        const taxable = snapshot.document.totals.taxableTotal;
        const tax = snapshot.document.totals.taxTotal;
        return {
          invoiceNumber: invoice.number,
          customer: invoice.customer,
          taxable,
          cgst: Math.round((tax / 2) * 100) / 100,
          sgst: Math.round((tax / 2) * 100) / 100,
          igst: 0,
          total: invoice.total,
        };
      }
      // Fallback proxy when snapshot is unavailable.
      const taxable = Math.round((invoice.total / 1.18) * 100) / 100;
      const tax = Math.round((invoice.total - taxable) * 100) / 100;
      return {
        invoiceNumber: invoice.number,
        customer: invoice.customer,
        taxable,
        cgst: Math.round((tax / 2) * 100) / 100,
        sgst: Math.round((tax / 2) * 100) / 100,
        igst: 0,
        total: invoice.total,
      };
    });
}

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const sanitize = (value: string | number) => {
    if (typeof value === "number") return String(value);
    const text = String(value ?? "");
    if (/^\+\d/.test(text) || /^-\d+(\.\d+)?$/.test(text)) return text;
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  };
  const escape = (value: string | number) =>
    `"${sanitize(value).replaceAll('"', '""')}"`;
  return [
    headers.map((header) => escape(header)).join(","),
    ...rows.map((row) =>
      headers.map((key) => escape(row[key] ?? "")).join(","),
    ),
  ].join("\n");
}
