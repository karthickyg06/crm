import type { OrgInvoicePreferences } from "@/features/invoices/types/invoice.types";
import { createDefaultOrgPreferences } from "@/features/invoices/utils/invoiceFormatter";

const STORAGE_KEY = "yaglob.invoice.orgPrefs.default";

export function loadOrgInvoicePreferences(): OrgInvoicePreferences {
  if (typeof window === "undefined") return createDefaultOrgPreferences();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultOrgPreferences();
    const parsed = JSON.parse(raw) as Partial<OrgInvoicePreferences>;
    const defaults = createDefaultOrgPreferences();
    return {
      ...defaults,
      ...parsed,
      company: { ...defaults.company, ...parsed.company },
      fieldVisibility: {
        ...defaults.fieldVisibility,
        ...parsed.fieldVisibility,
      },
    };
  } catch {
    return createDefaultOrgPreferences();
  }
}

export function saveOrgInvoicePreferences(prefs: OrgInvoicePreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function updateOrgInvoicePreferences(
  patch: Partial<OrgInvoicePreferences>,
): OrgInvoicePreferences {
  const current = loadOrgInvoicePreferences();
  const next: OrgInvoicePreferences = {
    ...current,
    ...patch,
    company: { ...current.company, ...patch.company },
    fieldVisibility: { ...current.fieldVisibility, ...patch.fieldVisibility },
  };
  saveOrgInvoicePreferences(next);
  return next;
}
