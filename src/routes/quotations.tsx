import { createFileRoute } from "@tanstack/react-router";
import { requireModuleAccess } from "@/features/auth/guards";
import { QuotationsPage } from "@/features/quotations/QuotationsPage";

export const Route = createFileRoute("/quotations")({
  beforeLoad: async () => {
    await requireModuleAccess("quotations", "view");
  },
  head: () => ({
    meta: [
      { title: "Quotations | Yaglob CRM" },
      {
        name: "description",
        content: "Create quotations and convert accepted quotes to invoices.",
      },
    ],
  }),
  component: QuotationsPage,
});
