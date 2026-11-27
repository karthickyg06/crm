import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resetDemoData } from "@/features/erp/demoStore";
import { clearDeliveryJobs } from "@/features/invoices/services/deliveryService";
import { clearInvoiceSnapshots } from "@/features/invoices/services/snapshotStore";
import { TemplateSelector } from "@/features/invoices/components/TemplateSelector";
import {
  loadOrgInvoicePreferences,
  updateOrgInvoicePreferences,
} from "@/features/invoices/services/orgPrefsStore";
import type {
  OrgInvoicePreferences,
  PaperFormat,
} from "@/features/invoices/types/invoice.types";
import { createSampleInvoiceDocument } from "@/features/invoices/utils/sampleDocument";
import { FormField } from "@/features/crm/shared";
import { ensureSeedInvoiceSnapshots } from "@/features/erp/ensureInvoiceSnapshots";

export function InvoiceSettingsPanel({ onClose }: { onClose?: () => void }) {
  const [prefs, setPrefs] = useState<OrgInvoicePreferences>(() =>
    loadOrgInvoicePreferences(),
  );
  const sample = createSampleInvoiceDocument(prefs.defaultDigitalTemplateId);

  const save = () => {
    const next = updateOrgInvoicePreferences(prefs);
    setPrefs(next);
    toast("Invoice preferences saved.");
    onClose?.();
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Company profile</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Company name">
            <Input
              value={prefs.company.name}
              onChange={(event) =>
                setPrefs((current) => ({
                  ...current,
                  company: { ...current.company, name: event.target.value },
                }))
              }
            />
          </FormField>
          <FormField label="Brand color">
            <Input
              type="color"
              value={prefs.company.brandColor}
              onChange={(event) =>
                setPrefs((current) => ({
                  ...current,
                  company: {
                    ...current.company,
                    brandColor: event.target.value,
                  },
                }))
              }
            />
          </FormField>
          <FormField label="GSTIN" className="sm:col-span-2">
            <Input
              value={prefs.company.gstin ?? ""}
              onChange={(event) =>
                setPrefs((current) => ({
                  ...current,
                  company: { ...current.company, gstin: event.target.value },
                }))
              }
            />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <Textarea
              rows={2}
              value={prefs.company.address}
              onChange={(event) =>
                setPrefs((current) => ({
                  ...current,
                  company: { ...current.company, address: event.target.value },
                }))
              }
            />
          </FormField>
          <FormField label="Footer message" className="sm:col-span-2">
            <Input
              value={prefs.company.footerMessage ?? ""}
              onChange={(event) =>
                setPrefs((current) => ({
                  ...current,
                  company: {
                    ...current.company,
                    footerMessage: event.target.value,
                  },
                }))
              }
            />
          </FormField>
          <FormField label="Invoice numbering format" className="sm:col-span-2">
            <Input
              value={prefs.numberingFormat}
              onChange={(event) =>
                setPrefs((current) => ({
                  ...current,
                  numberingFormat: event.target.value,
                }))
              }
              placeholder="INV-{YYYY}-{####}"
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Defaults</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Default paper">
            <Select
              value={prefs.defaultPaper}
              onValueChange={(value) =>
                setPrefs((current) => ({
                  ...current,
                  defaultPaper: value as PaperFormat,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="A5">A5</SelectItem>
                <SelectItem value="T80">80mm</SelectItem>
                <SelectItem value="T58">58mm</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={prefs.autoOpenPrintAfterIssue}
                onCheckedChange={(value) =>
                  setPrefs((current) => ({
                    ...current,
                    autoOpenPrintAfterIssue: Boolean(value),
                  }))
                }
              />
              Auto-open print after issue
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={prefs.notifyWhatsAppOnIssue}
                onCheckedChange={(value) =>
                  setPrefs((current) => ({
                    ...current,
                    notifyWhatsAppOnIssue: Boolean(value),
                  }))
                }
              />
              Queue WhatsApp on issue
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={prefs.notifyEmailOnIssue}
                onCheckedChange={(value) =>
                  setPrefs((current) => ({
                    ...current,
                    notifyEmailOnIssue: Boolean(value),
                  }))
                }
              />
              Queue email on issue
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Optional fields</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            Object.keys(prefs.fieldVisibility) as Array<
              keyof typeof prefs.fieldVisibility
            >
          ).map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 text-xs capitalize"
            >
              <Checkbox
                checked={prefs.fieldVisibility[key]}
                onCheckedChange={(value) =>
                  setPrefs((current) => ({
                    ...current,
                    fieldVisibility: {
                      ...current.fieldVisibility,
                      [key]: Boolean(value),
                    },
                  }))
                }
              />
              {key.replace(/([A-Z])/g, " $1")}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Template library</h3>
        <TemplateSelector
          document={sample}
          selectedTemplateId={prefs.defaultDigitalTemplateId}
          defaultTemplateId={prefs.defaultDigitalTemplateId}
          visibility={prefs.fieldVisibility}
          onSelect={(templateId) =>
            setPrefs((current) => ({
              ...current,
              defaultDigitalTemplateId: templateId,
            }))
          }
          onSetDefault={(templateId) =>
            setPrefs((current) => ({
              ...current,
              defaultDigitalTemplateId: templateId,
              defaultPrintTemplateId: templateId,
            }))
          }
        />
      </section>

      <section className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <h3 className="text-sm font-semibold">Demo data</h3>
        <p className="text-xs text-muted-foreground">
          Reset local demo store (`yaglob.demo.*`) and reseed invoice snapshots.
          Does not affect production databases.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearInvoiceSnapshots();
            clearDeliveryJobs();
            resetDemoData();
            ensureSeedInvoiceSnapshots();
            toast(
              "Business demo data reset. User accounts, roles, and development status were preserved.",
            );
          }}
        >
          Reset demo data
        </Button>
      </section>

      <div className="flex justify-end gap-2">
        {onClose ? (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        ) : null}
        <Button className="bg-[#2F6BFF] hover:bg-[#2558d9]" onClick={save}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
