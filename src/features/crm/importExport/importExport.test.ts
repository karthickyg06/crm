import { beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import {
  customersImportConfig,
  leadsImportConfig,
  productsImportConfig,
  vendorsImportConfig,
} from "./modules";
import { parseCsvText, runImportOnParsed } from "./index";
import { rowsToCsv, rowsToXlsxArrayBuffer } from "./serialize";
import { sanitizeCell } from "./sanitize";
import {
  listProducts,
  listVendors,
  loadCustomers,
  loadLeads,
  resetDemoData,
} from "@/features/erp/demoStore";

function mockStorage() {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", storage);
}

describe("import/export engine", () => {
  beforeEach(() => {
    mockStorage();
    resetDemoData();
  });

  it("imports a valid CSV of leads and persists after reload", () => {
    const before = loadLeads().length;
    const csv = [
      "Name,Company,Phone,Email,Source,Status,Value",
      "Import Lead,Import Co,+91 90000 11111,import.lead@example.com,Website,New,50000",
    ].join("\n");
    const parsed = parseCsvText(csv);
    const summary = runImportOnParsed("leads.csv", parsed, leadsImportConfig);
    expect(summary.imported).toBe(1);
    expect(summary.failed).toBe(0);
    expect(loadLeads().length).toBe(before + 1);
    expect(
      loadLeads().some((lead) => lead.email === "import.lead@example.com"),
    ).toBe(true);
  });

  it("imports a valid XLSX of customers", () => {
    const before = loadCustomers().length;
    const rows = [
      {
        Name: "Excel Customer",
        Company: "Excel Corp",
        Phone: "+91 90000 22222",
        Email: "excel.customer@example.com",
        Industry: "Services",
        Status: "Active",
      },
    ];
    const buffer = rowsToXlsxArrayBuffer(rows, "Customers");
    const workbook = XLSX.read(buffer, { type: "array", raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]!];
    const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet!, {
      header: 1,
      raw: false,
      defval: "",
    });
    const headers = (matrix[0] ?? []).map((cell) => String(cell));
    const dataRows = matrix.slice(1).map((cells) => {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = String(cells[index] ?? "");
      });
      return row;
    });
    const summary = runImportOnParsed(
      "customers.xlsx",
      { headers, rows: dataRows },
      customersImportConfig,
    );
    expect(summary.imported).toBe(1);
    expect(loadCustomers().length).toBe(before + 1);
  });

  it("rejects missing required headers", () => {
    const csv = "Phone,Email\n+91 90000 00000,a@b.com";
    const parsed = parseCsvText(csv);
    const summary = runImportOnParsed("bad.csv", parsed, leadsImportConfig);
    expect(summary.imported).toBe(0);
    expect(summary.failed).toBeGreaterThan(0);
    expect(summary.errors[0]?.message).toMatch(/Missing required columns/i);
  });

  it("skips duplicate customers by email without overwrite", () => {
    const existing = loadCustomers()[0]!;
    const csv = [
      "Name,Company,Phone,Email",
      `Other Name,Other Co,+91 91111 00000,${existing.email}`,
    ].join("\n");
    const before = loadCustomers().length;
    const summary = runImportOnParsed(
      "dup.csv",
      parseCsvText(csv),
      customersImportConfig,
    );
    expect(summary.imported).toBe(0);
    expect(summary.skippedDuplicates).toBe(1);
    expect(loadCustomers().length).toBe(before);
    expect(
      loadCustomers().find((customer) => customer.email === existing.email)
        ?.name,
    ).toBe(existing.name);
  });

  it("does not treat company name alone as a customer duplicate key", () => {
    const existing = loadCustomers()[0]!;
    const csv = [
      "Name,Company,Phone,Email",
      `Brand New Person,${existing.company},+91 93333 44444,brand.new.person@example.com`,
    ].join("\n");
    const before = loadCustomers().length;
    const summary = runImportOnParsed(
      "company-only.csv",
      parseCsvText(csv),
      customersImportConfig,
    );
    expect(summary.imported).toBe(1);
    expect(loadCustomers().length).toBe(before + 1);
  });

  it("skips duplicate product SKUs", () => {
    const existing = listProducts()[0]!;
    const csv = [
      "Name,SKU,HSN/SAC,Selling Price,GST %,Type",
      `Cloned,${existing.sku},998314,100,18,product`,
    ].join("\n");
    const before = listProducts().length;
    const summary = runImportOnParsed(
      "sku.csv",
      parseCsvText(csv),
      productsImportConfig,
    );
    expect(summary.imported).toBe(0);
    expect(summary.skippedDuplicates).toBe(1);
    expect(listProducts().length).toBe(before);
  });

  it("records invalid email rows as failures", () => {
    const csv = [
      "Name,Company,Phone,Email",
      "Bad Email,Bad Co,+91 90000 55555,not-an-email",
    ].join("\n");
    const summary = runImportOnParsed(
      "invalid.csv",
      parseCsvText(csv),
      customersImportConfig,
    );
    expect(summary.imported).toBe(0);
    expect(summary.failed).toBe(1);
    expect(summary.errors[0]?.message).toMatch(/Invalid email/i);
  });

  it("imports vendors and preserves phone text", () => {
    const csv = [
      "Company,Contact Name,Phone,Email,Status",
      "Fresh Vendor LLC,Anita,+91 01234 56789,anita.vendor@example.com,Active",
    ].join("\n");
    const before = listVendors().length;
    const summary = runImportOnParsed(
      "vendors.csv",
      parseCsvText(csv),
      vendorsImportConfig,
    );
    expect(summary.imported).toBe(1);
    expect(listVendors().length).toBe(before + 1);
    expect(listVendors().some((vendor) => vendor.phone.includes("01234"))).toBe(
      true,
    );
  });

  it("protects CSV export against spreadsheet formula injection", () => {
    const csv = rowsToCsv([
      { Name: "=CMD()", Phone: "+91 90000 00000", Note: "+hack" },
    ]);
    expect(csv).toContain('"\'=CMD()"');
    expect(csv).toContain('"\'+hack"');
    expect(sanitizeCell("=1+1")).toBe("'=1+1");
    expect(sanitizeCell(42)).toBe("42");
  });

  it("exports round-tripable product rows with clear headings", () => {
    const product = listProducts()[0]!;
    const row = productsImportConfig.toExportRow(product);
    expect(Object.keys(row)).toEqual(
      expect.arrayContaining([
        "Name",
        "SKU",
        "HSN/SAC",
        "Selling Price",
        "GST %",
        "Type",
      ]),
    );
    const csv = rowsToCsv([row]);
    const reimport = runImportOnParsed(
      "roundtrip.csv",
      parseCsvText(csv),
      productsImportConfig,
    );
    expect(reimport.imported).toBe(0);
    expect(reimport.skippedDuplicates).toBe(1);
  });
});
