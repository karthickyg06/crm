import type { ImportColumnDef, ImportRowError } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

export function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[%₹$]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildHeaderMap(
  fileHeaders: string[],
  columns: ImportColumnDef[],
): { mapped: Record<string, string>; missingRequired: string[] } {
  const normalizedFile = new Map(
    fileHeaders.map((header) => [normalizeHeader(header), header]),
  );
  const mapped: Record<string, string> = {};
  const missingRequired: string[] = [];

  for (const column of columns) {
    const candidates = [column.header, ...(column.aliases ?? [])].map(
      normalizeHeader,
    );
    let matched: string | undefined;
    for (const candidate of candidates) {
      const hit = normalizedFile.get(candidate);
      if (hit) {
        matched = hit;
        break;
      }
    }
    if (matched) {
      mapped[column.key] = matched;
    } else if (column.required) {
      missingRequired.push(column.header);
    }
  }

  return { mapped, missingRequired };
}

export function mapRawRow(
  raw: Record<string, string>,
  headerMap: Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, header] of Object.entries(headerMap)) {
    next[key] = raw[header] ?? "";
  }
  return next;
}

function validateField(column: ImportColumnDef, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    if (column.required) return `${column.header} is required.`;
    return null;
  }

  switch (column.type) {
    case "email":
      if (!EMAIL_RE.test(trimmed)) return `Invalid email: ${trimmed}`;
      break;
    case "phone":
      if (!PHONE_RE.test(trimmed)) return `Invalid phone: ${trimmed}`;
      break;
    case "number":
    case "percent": {
      const num = Number(trimmed.replace(/,/g, ""));
      if (!Number.isFinite(num)) return `Invalid number for ${column.header}.`;
      if (column.type === "percent" && (num < 0 || num > 100)) {
        return `${column.header} must be between 0 and 100.`;
      }
      if (num < 0 && column.key.toLowerCase().includes("qty")) {
        return `${column.header} cannot be negative.`;
      }
      break;
    }
    case "gstin":
      if (!GSTIN_RE.test(trimmed)) return `Invalid GSTIN: ${trimmed}`;
      break;
    case "date": {
      const parsed = Date.parse(trimmed);
      if (Number.isNaN(parsed) && !/^\d{1,2}\s+\w+/.test(trimmed)) {
        return `Invalid date for ${column.header}: ${trimmed}`;
      }
      break;
    }
    case "enum":
      if (
        column.enumValues &&
        !column.enumValues.some(
          (entry) => entry.toLowerCase() === trimmed.toLowerCase(),
        )
      ) {
        return `${column.header} must be one of: ${column.enumValues.join(", ")}.`;
      }
      break;
    default:
      break;
  }
  return null;
}

export function validateMappedRow(
  mapped: Record<string, string>,
  columns: ImportColumnDef[],
  rowNumber: number,
): ImportRowError | null {
  const messages: string[] = [];
  for (const column of columns) {
    const message = validateField(column, mapped[column.key] ?? "");
    if (message) messages.push(message);
  }
  if (messages.length === 0) return null;
  return {
    row: rowNumber,
    message: messages.join(" "),
    values: mapped,
  };
}

export function parseOptionalNumber(value: string | undefined, fallback = 0) {
  if (value === undefined || value.trim() === "") return fallback;
  const num = Number(value.replace(/,/g, ""));
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}
