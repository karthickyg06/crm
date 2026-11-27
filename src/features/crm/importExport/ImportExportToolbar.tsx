import { useRef, useState, type ReactNode } from "react";
import { Download, FileSpreadsheet, Loader2, Plus, Upload } from "lucide-react";
import { notify, recordAndToast } from "@/features/notifications/notify";
import type { NotificationModule } from "@/features/notifications/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { importFileForModule } from "./engine";
import { downloadCsv, downloadXlsx, stampFilename } from "./serialize";
import type { ImportSummary, ModuleImportConfig } from "./types";

const outlineClass =
  "h-10 gap-2 rounded-xl border-border bg-card px-4 text-sm font-medium shadow-none";
const primaryClass =
  "h-10 gap-2 rounded-xl bg-[#2F6BFF] px-4 text-sm font-semibold text-white hover:bg-[#2558d9]";
const iconClass = "h-4 w-4 shrink-0";

type ImportExportToolbarProps<T> = {
  config: ModuleImportConfig<T>;
  /** Filtered/search-visible records for export. */
  records: T[];
  onImported?: (() => void) | undefined;
  addNewLabel?: string | undefined;
  onAddNew?: (() => void) | undefined;
  className?: string | undefined;
  includeImport?: boolean | undefined;
  includeExport?: boolean | undefined;
  includeSample?: boolean | undefined;
  children?: ReactNode | undefined;
};

export function ImportExportToolbar<T>({
  config,
  records,
  onImported,
  addNewLabel,
  onAddNew,
  className,
  includeImport = true,
  includeExport = true,
  includeSample = true,
  children,
}: ImportExportToolbarProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const exportRows = () => records.map((record) => config.toExportRow(record));

  const handleImportClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const result = await importFileForModule(file, config);
      setSummary(result);
      const moduleId = (
        config.moduleId === "leads" ||
        config.moduleId === "customers" ||
        config.moduleId === "products" ||
        config.moduleId === "vendors"
          ? config.moduleId
          : "system"
      ) as NotificationModule;
      if (result.imported > 0) {
        onImported?.();
        recordAndToast({
          module: moduleId,
          eventType: "import.completed",
          title: "Import completed",
          description: `Imported ${result.imported} of ${result.total} ${config.label.toLowerCase()}.`,
          severity: "success",
          operationStatus: "succeeded",
          relatedRoute: `/${config.moduleId}`,
          idempotencyKey: `import-${config.moduleId}-${Date.now()}`,
        });
      } else if (result.skippedDuplicates > 0 && result.failed === 0) {
        notify.warning(
          `No new records imported. ${result.skippedDuplicates} duplicate(s) skipped.`,
        );
      } else if (result.failed > 0) {
        recordAndToast({
          module: moduleId,
          eventType: "import.failed",
          title: "Import failed",
          description: `Import failed for ${result.failed} row(s). See details.`,
          severity: "error",
          operationStatus: "failed",
          relatedRoute: `/${config.moduleId}`,
          idempotencyKey: `import-fail-${config.moduleId}-${Date.now()}`,
        });
      } else {
        notify.info("No records were imported from the selected file.");
      }
    } catch (error) {
      notify.error(
        error instanceof Error ? error.message : "Unable to import the file.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleExport = (format: "csv" | "xlsx") => {
    const rows = exportRows();
    if (rows.length === 0) {
      notify.warning("Nothing to export for the current filters.");
      return;
    }
    const base = stampFilename(config.moduleId, format).replace(
      /\.(csv|xlsx)$/,
      "",
    );
    if (format === "csv") {
      downloadCsv(`${base}.csv`, rows);
    } else {
      downloadXlsx(`${base}.xlsx`, rows, config.label);
    }
    recordAndToast({
      module: (config.moduleId as NotificationModule) || "system",
      eventType: "export.completed",
      title: "Export completed",
      description: `Exported ${rows.length} ${config.label.toLowerCase()}.`,
      severity: "success",
      operationStatus: "succeeded",
      relatedRoute: `/${config.moduleId}`,
      idempotencyKey: `export-${config.moduleId}-${format}-${Date.now()}`,
    });
  };

  const handleSample = (format: "csv" | "xlsx") => {
    const rows = config.sampleRows;
    const base = `${config.moduleId}-import-template`;
    if (format === "csv") {
      downloadCsv(`${base}.csv`, rows);
    } else {
      downloadXlsx(`${base}.xlsx`, rows, `${config.label} Template`);
    }
    notify.info(`Downloaded ${config.label} sample template.`);
  };

  const downloadFailed = () => {
    if (!summary || summary.failedRows.length === 0) return;
    downloadCsv(
      `${config.moduleId}-import-errors.csv`,
      summary.failedRows.map((row) => {
        const next: Record<string, string | number> = {};
        Object.entries(row).forEach(([key, value]) => {
          next[key] = value;
        });
        return next;
      }),
    );
  };

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {includeImport ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(outlineClass, "hidden sm:inline-flex")}
            disabled={busy}
            onClick={handleImportClick}
            aria-label={`Import ${config.label}`}
          >
            {busy ? (
              <Loader2 className={cn(iconClass, "animate-spin")} />
            ) : (
              <Upload className={iconClass} />
            )}
            Import
          </Button>
        ) : null}

        {includeExport ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(outlineClass, "hidden sm:inline-flex")}
                aria-label={`Export ${config.label}`}
              >
                <Download className={iconClass} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleExport("csv")}>
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("xlsx")}>
                Export Excel (XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {includeSample ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(outlineClass, "hidden md:inline-flex")}
                aria-label={`Download ${config.label} sample template`}
              >
                <FileSpreadsheet className={iconClass} />
                Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleSample("csv")}>
                Sample CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSample("xlsx")}>
                Sample Excel (XLSX)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {children}

        {onAddNew && addNewLabel ? (
          <Button
            type="button"
            size="sm"
            className={primaryClass}
            onClick={onAddNew}
          >
            <Plus className={iconClass} />
            {addNewLabel}
          </Button>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Dialog
        open={Boolean(summary)}
        onOpenChange={(open) => !open && setSummary(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import summary</DialogTitle>
            <DialogDescription>
              Results for {summary?.fileName ?? "selected file"}.
            </DialogDescription>
          </DialogHeader>
          {summary ? (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-muted-foreground">File</dt>
                  <dd className="truncate font-medium">{summary.fileName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total rows</dt>
                  <dd className="font-medium tabular-nums">{summary.total}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Imported</dt>
                  <dd className="font-medium tabular-nums text-[#2F6BFF]">
                    {summary.imported}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Skipped duplicates</dt>
                  <dd className="font-medium tabular-nums">
                    {summary.skippedDuplicates}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Failed</dt>
                  <dd className="font-medium tabular-nums text-danger">
                    {summary.failed}
                  </dd>
                </div>
              </dl>

              {summary.imported === 0 ? (
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  No records were imported.
                </p>
              ) : null}

              {summary.errors.length > 0 ? (
                <div className="max-h-40 space-y-1 overflow-auto rounded-lg border border-border p-2 text-xs">
                  {summary.errors.slice(0, 50).map((error) => (
                    <p key={`${error.row}-${error.message}`}>
                      Row {error.row}: {error.message}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            {summary && summary.failedRows.length > 0 ? (
              <Button type="button" variant="outline" onClick={downloadFailed}>
                <Download className={iconClass} />
                Download failed rows
              </Button>
            ) : null}
            <Button type="button" onClick={() => setSummary(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
