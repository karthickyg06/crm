import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { ReportsPage } from "@/features/erp/pages/ReportsPage";

export const Route = createFileRoute("/reports")({
  beforeLoad: async () => {
    await requireModuleAccess("reports", "view");
  },
  head: () => ({
    meta: [
      { title: "Reports | Yaglob CRM" },
      {
        name: "description",
        content: "Sales, payment, outstanding, stock, and GST reports.",
      },
    ],
  }),
  component: ReportsPage,
});
