/**
 * CSV / XLSX serialization with formula-injection protection.
 * SheetJS CE 0.20.3 — https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
 */
import * as XLSX from "xlsx";

import { sanitizeCell, sanitizeRow } from "./sanitize";
import type { ImportColumnDef } from "./types";

export function rowsToCsv(
  rows: Array<Record<string, string | number>>,
): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (value: string | number) => {
    const safe = sanitizeCell(value);
    return `"${String(safe).replaceAll('"', '""')}"`;
  };
  return [
    headers.map(escape).join(","),
    ...rows.map((row) =>
      headers.map((key) => escape(row[key] ?? "")).join(","),
    ),
  ].join("\n");
}

export function rowsToXlsxArrayBuffer(
  rows: Array<Record<string, string | number>>,
  sheetName = "Export",
): ArrayBuffer {
  const safeRows = rows.map(sanitizeRow);
  const worksheet = XLSX.utils.json_to_sheet(safeRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  return XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, string | number>>,
) {
  const csv = rowsToCsv(rows);
  downloadBlob(
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
}

export function downloadXlsx(
  filename: string,
  rows: Array<Record<string, string | number>>,
  sheetName?: string,
) {
  const buffer = rowsToXlsxArrayBuffer(rows, sheetName);
  downloadBlob(
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}

export function buildSampleRows(columns: ImportColumnDef[]) {
  return [
    Object.fromEntries(columns.map((col) => [col.header, col.example ?? ""])),
  ];
}

export function stampFilename(base: string, ext: "csv" | "xlsx") {
  const day = new Date().toISOString().slice(0, 10);
  return `${base}-${day}.${ext}`;
}
