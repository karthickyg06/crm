export type ImportFieldType =
  | "string"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "gstin"
  | "percent"
  | "enum";

export type ImportColumnDef = {
  key: string;
  header: string;
  aliases?: string[];
  required?: boolean;
  type?: ImportFieldType;
  /** Preserve as text (SKU, phone) — never coerce to number. */
  preserveText?: boolean;
  enumValues?: string[];
  example?: string;
};

export type ImportRowError = {
  row: number;
  message: string;
  values: Record<string, string>;
};

export type ImportSummary = {
  fileName: string;
  total: number;
  imported: number;
  skippedDuplicates: number;
  failed: number;
  errors: ImportRowError[];
  failedRows: Array<Record<string, string>>;
};

export type ParsedSheet = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export type ModuleImportConfig<T> = {
  moduleId: string;
  label: string;
  columns: ImportColumnDef[];
  /** Build a stable duplicate key; return null if row lacks enough identity. */
  duplicateKey: (record: Partial<T> & Record<string, unknown>) => string | null;
  existingKeys: () => Set<string>;
  mapRow: (row: Record<string, string>, index: number) => T;
  persist: (records: T[]) => void;
  toExportRow: (record: T) => Record<string, string | number>;
  sampleRows: Array<Record<string, string>>;
};

export const IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 2_000;
export const IMPORT_ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;
