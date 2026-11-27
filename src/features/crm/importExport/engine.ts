import { parseImportFile } from "./parse";
import type { ImportSummary, ModuleImportConfig, ParsedSheet } from "./types";
import { buildHeaderMap, mapRawRow, validateMappedRow } from "./validate";

export function runImportOnParsed<T>(
  fileName: string,
  parsed: ParsedSheet,
  config: ModuleImportConfig<T>,
): ImportSummary {
  const { mapped: headerMap, missingRequired } = buildHeaderMap(
    parsed.headers,
    config.columns,
  );

  if (missingRequired.length > 0) {
    return {
      fileName,
      total: parsed.rows.length,
      imported: 0,
      skippedDuplicates: 0,
      failed: parsed.rows.length,
      errors: [
        {
          row: 1,
          message: `Missing required columns: ${missingRequired.join(", ")}.`,
          values: {},
        },
      ],
      failedRows: parsed.rows,
    };
  }

  const existing = config.existingKeys();
  const seenInFile = new Set<string>();
  const toPersist: T[] = [];
  const errors: ImportSummary["errors"] = [];
  const failedRows: Array<Record<string, string>> = [];
  let skippedDuplicates = 0;

  parsed.rows.forEach((raw, index) => {
    const rowNumber = index + 2; // 1-based data row after header
    const mapped = mapRawRow(raw, headerMap);
    const blank = Object.values(mapped).every((value) => !value.trim());
    if (blank) return;

    const validationError = validateMappedRow(
      mapped,
      config.columns,
      rowNumber,
    );
    if (validationError) {
      errors.push(validationError);
      failedRows.push({
        ...raw,
        __error: validationError.message,
      });
      return;
    }

    let record: T;
    try {
      record = config.mapRow(mapped, index);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to map row.";
      errors.push({ row: rowNumber, message, values: mapped });
      failedRows.push({ ...raw, __error: message });
      return;
    }

    const key = config.duplicateKey(
      record as Partial<T> & Record<string, unknown>,
    );
    if (key) {
      if (existing.has(key) || seenInFile.has(key)) {
        skippedDuplicates += 1;
        return;
      }
      seenInFile.add(key);
      existing.add(key);
    }

    toPersist.push(record);
  });

  if (toPersist.length > 0) {
    config.persist(toPersist);
  }

  return {
    fileName,
    total: parsed.rows.length,
    imported: toPersist.length,
    skippedDuplicates,
    failed: errors.length,
    errors,
    failedRows,
  };
}

export async function importFileForModule<T>(
  file: File,
  config: ModuleImportConfig<T>,
): Promise<ImportSummary> {
  const parsed = await parseImportFile(file);
  return runImportOnParsed(file.name, parsed, config);
}
