import { describe, expect, it } from "vitest";

import {
  getInvoiceTemplate,
  invoiceTemplates,
  listInvoiceTemplateIds,
} from "@/features/invoices/templates/templateRegistry";

describe("invoice template registry", () => {
  it("registers all eight built-in templates", () => {
    expect(invoiceTemplates).toHaveLength(8);
    expect(listInvoiceTemplateIds()).toEqual([
      "classic-a4",
      "professional-a4",
      "modern-a4",
      "corporate-gst-a4",
      "bw-a4",
      "compact-a5",
      "thermal-80",
      "thermal-58",
    ]);
  });

  it("falls back to classic when id is unknown", () => {
    expect(getInvoiceTemplate("missing").id).toBe("classic-a4");
  });

  it("exposes dedicated paper formats for thermal templates", () => {
    expect(getInvoiceTemplate("thermal-80").paper).toBe("T80");
    expect(getInvoiceTemplate("thermal-58").paper).toBe("T58");
    expect(getInvoiceTemplate("compact-a5").paper).toBe("A5");
  });
});
