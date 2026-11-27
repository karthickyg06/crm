/**
 * Spreadsheet parsing — SheetJS Community Edition 0.20.3
 * Installed from the official CDN (not the stale npm 0.18.5 release):
 *   https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
 * Remediation for CVE-2024-22363 (ReDoS) requires >= 0.20.2.
 * Supports CSV, XLSX, and legacy XLS via SheetJS.
 */
import * as XLSX from "xlsx";

import {
  IMPORT_ACCEPTED_EXTENSIONS,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_ROWS,
  type ParsedSheet,
} from "./types";

function extensionOf(fileName: string) {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : "";
}

export function assertSupportedImportFile(file: File) {
  if (file.size <= 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > IMPORT_MAX_FILE_BYTES) {
    throw new Error(
      `File exceeds the ${Math.round(IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB size limit.`,
    );
  }
  const ext = extensionOf(file.name);
  if (
    !(IMPORT_ACCEPTED_EXTENSIONS as readonly string[]).includes(ext) &&
    !file.type.includes("csv") &&
    !file.type.includes("sheet") &&
    !file.type.includes("excel")
  ) {
    throw new Error("Unsupported file format. Use CSV, XLSX, or XLS.");
  }
}

function sheetToParsed(workbook: XLSX.WorkBook): ParsedSheet {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The workbook has no sheets.");
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("Unable to read the first worksheet.");
  }

  // raw:false + defval keeps phone/SKU as strings and preserves leading zeros
  // when Excel stored them as text. Numbers still stringify via format.
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
    sheet,
    {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    },
  );

  if (matrix.length === 0) {
    throw new Error("The file contains no data rows.");
  }

  const headerCells = (matrix[0] ?? []).map((cell) =>
    String(cell ?? "").trim(),
  );
  if (headerCells.every((h) => !h)) {
    throw new Error("Missing column headings in the first row.");
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length === 0) {
    throw new Error("The file has headings but no data rows.");
  }
  if (dataRows.length > IMPORT_MAX_ROWS) {
    throw new Error(
      `File has ${dataRows.length} rows; the limit is ${IMPORT_MAX_ROWS}.`,
    );
  }

  const headers = headerCells.map((h, i) => h || `Column ${i + 1}`);
  const rows = dataRows.map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      const value = cells[index];
      // Strip a single leading apostrophe used as an Excel text/formula marker.
      const text =
        value === null || value === undefined ? "" : String(value).trim();
      row[header] = text.startsWith("'") ? text.slice(1) : text;
    });
    return row;
  });

  return { headers, rows };
}

export async function parseImportFile(file: File): Promise<ParsedSheet> {
  assertSupportedImportFile(file);
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    raw: false,
    cellDates: false,
    cellText: true,
  });
  return sheetToParsed(workbook);
}

/** Pure CSV parser for tests and environments without binary sheets. */
export function parseCsvText(text: string): ParsedSheet {
  if (!text.trim()) {
    throw new Error("The file is empty.");
  }
  const workbook = XLSX.read(text, { type: "string", raw: false });
  return sheetToParsed(workbook);
}
