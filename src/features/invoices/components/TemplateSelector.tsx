import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { InvoicePreview } from "@/features/invoices/components/InvoicePreview";
import {
  invoiceTemplates,
  type InvoiceTemplateDefinition,
} from "@/features/invoices/templates/templateRegistry";
import type {
  InvoiceDocumentModel,
  InvoiceFieldVisibility,
} from "@/features/invoices/types/invoice.types";
import { paperLabel } from "@/features/invoices/utils/invoiceFormatter";
import { cn } from "@/lib/utils";

export function TemplateSelector({
  document,
  selectedTemplateId,
  defaultTemplateId,
  visibility,
  onSelect,
  onSetDefault,
}: {
  document: InvoiceDocumentModel;
  selectedTemplateId: string;
  defaultTemplateId?: string;
  visibility?: InvoiceFieldVisibility | undefined;
  onSelect: (templateId: string) => void;
  onSetDefault?: ((templateId: string) => void) | undefined;
}) {
  const [activeId, setActiveId] = useState(selectedTemplateId);
  const active = useMemo(
    () =>
      invoiceTemplates.find((template) => template.id === activeId) ??
      invoiceTemplates[0]!,
    [activeId],
  );

  const choose = (template: InvoiceTemplateDefinition) => {
    setActiveId(template.id);
    onSelect(template.id);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="grid max-h-[540px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {invoiceTemplates.map((template) => {
          const selected = template.id === activeId;
          const isDefault = template.id === defaultTemplateId;
          return (
            <article
              key={template.id}
              className={cn(
                "rounded-2xl border p-3 transition",
                selected
                  ? "border-[#2F6BFF] bg-[#F5F8FF] shadow-sm"
                  : "border-border bg-card",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {template.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {paperLabel(template.paper)}
                  </p>
                </div>
                {isDefault ? (
                  <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-semibold text-[#16A34A]">
                    Default
                  </span>
                ) : null}
              </div>
              <p className="mb-3 line-clamp-2 text-[11px] text-muted-foreground">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className={cn(
                    "h-8 rounded-lg text-xs",
                    selected ? "bg-[#2F6BFF] hover:bg-[#2558d9]" : "",
                  )}
                  variant={selected ? "default" : "outline"}
                  onClick={() => choose(template)}
                >
                  {selected ? "Selected" : "Select Template"}
                </Button>
                {onSetDefault ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs"
                    disabled={isDefault}
                    onClick={() => onSetDefault(template.id)}
                  >
                    Set as Default
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{active.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {paperLabel(active.paper)} · live preview
            </p>
          </div>
        </div>
        <InvoicePreview
          document={document}
          templateId={active.id}
          {...(visibility ? { visibility } : {})}
          className="h-[480px] w-full overflow-hidden rounded-xl border border-border bg-[#F8FAFC]"
        />
      </div>
    </div>
  );
}
