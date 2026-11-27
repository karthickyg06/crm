import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LayoutDashboard } from "lucide-react";

import {
  CardSkeleton,
  MetricCard,
  MetricGrid,
  SummaryCard,
} from "@/features/crm/shared";

afterEach(() => {
  cleanup();
});

describe("Premium 3D card system", () => {
  it("keeps KPI chrome classes and equal change-row reservation", () => {
    const { container } = render(
      <MetricGrid>
        <MetricCard
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Revenue"
          value="₹12,34,56,789.00"
        />
        <MetricCard
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Paid"
          value="₹100"
          change="4%"
          positive
        />
      </MetricGrid>,
    );

    const cards = container.querySelectorAll(".metric-card.metric-card--kpi");
    expect(cards).toHaveLength(2);
    expect(container.querySelector(".metric-grid")).toBeTruthy();
    expect(screen.getByTitle("₹12,34,56,789.00")).toHaveClass(
      "metric-card__value",
    );
    expect(container.querySelectorAll(".metric-card__change")).toHaveLength(2);
  });

  it("renders summary and skeleton variants with shared chrome", () => {
    const { container } = render(
      <>
        <SummaryCard>
          <p>Paid</p>
          <p className="summary-card__amount" title="₹9,99,99,999">
            ₹9,99,99,999
          </p>
        </SummaryCard>
        <CardSkeleton variant="kpi" />
        <CardSkeleton variant="summary" />
        <CardSkeleton variant="panel" />
      </>,
    );

    expect(container.querySelector(".summary-card")).toBeTruthy();
    expect(container.querySelector(".metric-card--kpi")).toBeTruthy();
    expect(container.querySelectorAll(".summary-card")).toHaveLength(2);
    expect(container.querySelector(".crm-card")).toBeTruthy();
  });
});
