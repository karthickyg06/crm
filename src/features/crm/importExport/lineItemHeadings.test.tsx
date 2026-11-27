import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { Dialog } from "@/components/ui/dialog";
import { QuotationForm } from "@/features/quotations/QuotationForm";
import { resetDemoData } from "@/features/erp/demoStore";

function mockStorage() {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", storage);
}

describe("product line-item headings", () => {
  beforeEach(() => {
    mockStorage();
    resetDemoData();
  });

  it("renders visible quotation line-item column headings", () => {
    render(
      <Dialog open>
        <QuotationForm
          editing={null}
          onSaved={() => undefined}
          onCancel={() => undefined}
        />
      </Dialog>,
    );

    expect(screen.getAllByText("Product / Service").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quantity").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Unit Price (₹)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Discount %").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GST %").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Quantity")).toBeTruthy();
    expect(screen.getByLabelText("Unit Price")).toBeTruthy();
  });
});
