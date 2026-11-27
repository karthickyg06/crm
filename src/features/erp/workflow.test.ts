import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDeliveryJob,
  processDeliveryJob,
} from "@/features/invoices/services/deliveryService";
import { invoiceTemplates } from "@/features/invoices/templates/templateRegistry";
import {
  computeTotals,
  computeLines,
} from "@/features/invoices/utils/calculations";

describe("Phase A + ERP workflow guards", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    });
  });

  it("registers eight templates across A4 A5 T80 T58", () => {
    expect(invoiceTemplates).toHaveLength(8);
    const papers = new Set(invoiceTemplates.map((template) => template.paper));
    expect(papers.has("A4")).toBe(true);
    expect(papers.has("A5")).toBe(true);
    expect(papers.has("T80")).toBe(true);
    expect(papers.has("T58")).toBe(true);
  });

  it("computes multi-line GST discount and round-off", () => {
    const lines = computeLines([
      {
        id: "1",
        name: "A",
        quantity: 2,
        unitPrice: 1000,
        discountPercent: 10,
        taxRatePercent: 18,
      },
      {
        id: "2",
        name: "B",
        quantity: 1,
        unitPrice: 500,
        discountPercent: 0,
        taxRatePercent: 18,
      },
    ]);
    const totals = computeTotals(lines, "cgst_sgst", 0);
    expect(totals.subtotal).toBe(2500);
    expect(totals.discountTotal).toBe(200);
    expect(totals.taxTotal).toBeGreaterThan(0);
    expect(totals.grandTotal).toBe(
      Math.round(totals.taxableTotal + totals.taxTotal),
    );
    expect(totals.roundOff).toBe(
      totals.grandTotal - (totals.taxableTotal + totals.taxTotal),
    );
  });

  it("delivery jobs never become Sent without live adapters", async () => {
    const job = createDeliveryJob({
      invoiceId: "inv-1",
      channel: "whatsapp",
      idempotencyKey: "inv-1:whatsapp:1",
    });
    expect(job.status).toBe("NotConfigured");
    const processed = await processDeliveryJob(job.id);
    expect(["NotConfigured", "Failed"]).toContain(processed.status);
    expect(processed.status).not.toBe("Sent");
    expect(processed.status).not.toBe("Delivered");
  });
});
