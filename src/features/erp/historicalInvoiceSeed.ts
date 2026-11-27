import type { Invoice } from "@/features/crm/data";
import type { PaymentRecord } from "@/features/erp/types";

const CUSTOMERS = [
  "StyleHub Retail",
  "Nova Apparel",
  "BrightPath Soft",
  "UrbanMart",
  "Finora Bank",
  "Fieldwork Labs",
  "Northstar Studio",
  "Monsoon Goods",
  "Orbit Health",
  "Sunday Market",
  "Paper & Pine",
  "Cedar & Co.",
  "Common Thread",
  "Brightside Works",
] as const;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function displayDate(date: Date) {
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function clampDay(year: number, monthIndex: number, day: number) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, last));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

type SeedSpec = {
  id: string;
  customer: (typeof CUSTOMERS)[number];
  year: number;
  monthIndex: number;
  day: number;
  total: number;
  /** Amount already collected (0..total). */
  paid: number;
  statusHint?: "Paid" | "Pending" | "Overdue" | "Draft";
};

/**
 * Build interconnected historical demo invoices relative to `now`.
 * Never emits invoice or payment dates in the future.
 * Current-year months after the current month stay empty.
 */
export function buildInvoiceSeed(now = new Date()): Invoice[] {
  const today = startOfDay(now);
  const currentYear = today.getFullYear();
  const lastYear = currentYear - 1;
  const currentMonth = today.getMonth();

  const specs: SeedSpec[] = [];
  let seq = 1;

  const pushMonth = (
    year: number,
    monthIndex: number,
    entries: Array<{
      day: number;
      total: number;
      paidRatio: number;
      overdue?: boolean;
      customer: (typeof CUSTOMERS)[number];
    }>,
  ) => {
    for (const entry of entries) {
      const issue = clampDay(year, monthIndex, entry.day);
      if (issue > today) continue;
      const paid = Math.round(entry.total * entry.paidRatio);
      const balance = entry.total - paid;
      let statusHint: SeedSpec["statusHint"] = "Pending";
      if (balance <= 0) statusHint = "Paid";
      else if (entry.overdue) statusHint = "Overdue";
      specs.push({
        id: `i${seq}`,
        customer: entry.customer,
        year,
        monthIndex,
        day: entry.day,
        total: entry.total,
        paid,
        statusHint,
      });
      seq += 1;
    }
  };

  // Last year — full Jan–Dec with varied sales.
  for (let month = 0; month < 12; month += 1) {
    const base = 42000 + month * 6500;
    pushMonth(lastYear, month, [
      {
        day: 8 + (month % 5),
        total: base,
        paidRatio: month % 3 === 0 ? 1 : month % 3 === 1 ? 0.45 : 0,
        overdue: month % 3 === 2,
        customer: CUSTOMERS[month % CUSTOMERS.length]!,
      },
      {
        day: 18 + (month % 4),
        total: base + 28000,
        paidRatio: month % 2 === 0 ? 1 : 0.6,
        overdue: false,
        customer: CUSTOMERS[(month + 3) % CUSTOMERS.length]!,
      },
    ]);
  }

  // Current year — only through the current month.
  for (let month = 0; month <= currentMonth; month += 1) {
    const base = 55000 + month * 7200;
    pushMonth(currentYear, month, [
      {
        day: 6 + (month % 6),
        total: base,
        paidRatio: month === currentMonth ? 0.35 : month % 3 === 0 ? 1 : 0.5,
        overdue: month < currentMonth && month % 4 === 1,
        customer: CUSTOMERS[(month + 1) % CUSTOMERS.length]!,
      },
      {
        day: 16 + (month % 5),
        total: base + 31000,
        paidRatio: month % 2 === 0 ? 1 : 0,
        overdue: month < currentMonth && month % 2 === 1,
        customer: CUSTOMERS[(month + 5) % CUSTOMERS.length]!,
      },
    ]);
  }

  return specs.map((spec, index) => {
    const issue = clampDay(spec.year, spec.monthIndex, spec.day);
    let due = addDays(issue, 30);
    if (spec.statusHint === "Overdue") {
      due = addDays(issue, -2);
      if (due > today) due = addDays(today, -1);
    }
    const balance = Math.max(0, spec.total - spec.paid);
    const numberYear = spec.year;
    const number = `INV-${numberYear}-${String(1000 + index).padStart(4, "0")}`;
    return {
      id: spec.id,
      number,
      customer: spec.customer,
      invoiceDate: displayDate(issue),
      dueDate: displayDate(due),
      total: spec.total,
      balance,
      status:
        balance <= 0
          ? "Paid"
          : spec.statusHint === "Overdue"
            ? "Overdue"
            : "Pending",
    } satisfies Invoice;
  });
}

export function buildHistoricalPayments(
  invoices: Invoice[],
  now = new Date(),
): PaymentRecord[] {
  const today = startOfDay(now);
  const payments: PaymentRecord[] = [];
  let payIndex = 0;

  for (const invoice of invoices) {
    const paidAmount = Math.max(0, invoice.total - invoice.balance);
    if (paidAmount <= 0) continue;

    const issue = parseFlexibleDate(invoice.invoiceDate) ?? today;
    const chunks =
      invoice.balance > 0 && paidAmount > 0
        ? [
            Math.round(paidAmount * 0.55),
            paidAmount - Math.round(paidAmount * 0.55),
          ]
        : [paidAmount];

    let cursor = addDays(
      issue,
      Math.min(
        5,
        Math.max(0, (today.getTime() - issue.getTime()) / 86400000 > 5 ? 5 : 1),
      ),
    );
    chunks.forEach((amount, chunkIndex) => {
      if (amount <= 0) return;
      if (cursor > today) cursor = today;
      if (cursor < issue) cursor = issue;
      const paidAt = isoDate(cursor);
      payments.push({
        id: `pay-seed-${invoice.id}-${chunkIndex + 1}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        customerName: invoice.customer,
        amount,
        method: payIndex % 2 === 0 ? "Bank transfer" : "UPI",
        reference: `TXN-SEED-${1000 + payIndex}`,
        paidAt,
        idempotencyKey: `pay:${invoice.id}:chunk:${chunkIndex + 1}`,
        createdAt: `${paidAt}T10:00:00.000Z`,
      });
      payIndex += 1;
      cursor = addDays(cursor, 9);
      if (cursor > today) cursor = today;
    });
  }

  return payments;
}

export function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iso = Date.parse(trimmed);
  if (!Number.isNaN(iso)) return startOfDay(new Date(iso));
  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const monthIndex = MONTH_SHORT.findIndex(
    (month) => month.toLowerCase() === match[2]!.toLowerCase(),
  );
  const year = Number(match[3]);
  if (monthIndex < 0 || !day || !year) return null;
  return startOfDay(new Date(year, monthIndex, day));
}

export { MONTH_SHORT };
